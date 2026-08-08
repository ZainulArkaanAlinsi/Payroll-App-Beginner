import 'server-only';

/**
 * Layanan mandiri karyawan — absen, cuti, lembur.
 *
 * Berkas ini ada karena aplikasinya kini punya dua muka: web untuk HR dan
 * aplikasi ponsel untuk karyawan. Web memanggilnya lewat server action dengan
 * FormData dan cookie, ponsel lewat API JSON dengan token Bearer. Keduanya
 * cara masuk yang berbeda ke aturan yang sama.
 *
 * Kalau aturannya ditulis dua kali, cepat atau lambat keduanya berbeda — dan
 * yang paling mungkin terlewat justru pemeriksaan yang membosankan: sisa kuota
 * cuti, tumpang tindih tanggal, lembur ganda di hari yang sama. Karyawan yang
 * mengajukan lewat ponsel akan menembus batas yang ditegakkan di web.
 *
 * Maka aturannya tinggal di sini, dan kedua muka itu hanya penerjemah.
 * Yang tidak boleh masuk ke berkas ini: apa pun yang khas Next.js
 * (revalidatePath, cookies, redirect) — itu urusan pemanggilnya.
 */

import { prisma } from './prisma';
import { audit, notify, type Session } from './auth';
import { upahDasarLembur } from './payroll-engine';
import { hitungUpahLembur, overtimeConfigDari, pilihAturan } from './policy';
import { tunjanganTetap } from './components';
import { tanggal } from './format';
import { FAIL, OK, type ActionState } from './types';
import { akhirPekan, hariIni, isoTanggal, kalender, pukul, tambahHari } from './waktu';

/** Siapa yang bertindak. Bentuknya sama untuk sesi web maupun token ponsel. */
export type Aktor = Pick<Session, 'userId' | 'name' | 'role' | 'employeeId'>;

const bisaKelola = (role: string) => role === 'ADMIN' || role === 'HR';

/** Hitung hari kerja (Sen–Jum) dalam rentang, inklusif. */
export function hariKerja(start: Date, end: Date): number {
  let n = 0;
  let d = start;
  while (d <= end) {
    if (!akhirPekan(d)) n++;
    d = tambahHari(d, 1);
  }
  return Math.max(1, n);
}

/** Beri tahu semua pengelola yang masih aktif. */
async function kabariPengelola(judul: string, isi: string, href: string) {
  const managers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'HR'] }, isActive: true },
    select: { id: true },
  });
  await Promise.all(managers.map((m) => notify(m.id, judul, isi, 'info', href)));
}

// ───────────────────────────── Cuti ─────────────────────────────

export interface InputCuti {
  employeeId: string;
  type: 'ANNUAL' | 'SICK' | 'UNPAID' | 'MATERNITY' | 'SPECIAL';
  startDate: string;
  endDate: string;
  reason: string;
}

export async function ajukanCuti(aktor: Aktor, input: InputCuti): Promise<ActionState> {
  // Karyawan biasa hanya boleh mengajukan untuk dirinya sendiri. Diperiksa di
  // sini, bukan di lapisan pemanggil, supaya tidak bisa dilewati dari ponsel.
  if (!bisaKelola(aktor.role) && input.employeeId !== aktor.employeeId) {
    return FAIL('Anda hanya bisa mengajukan cuti untuk diri sendiri.');
  }

  let start: Date;
  let end: Date;
  try {
    start = kalender(input.startDate);
    end = kalender(input.endDate);
  } catch {
    return FAIL('Tanggal tidak terbaca.');
  }
  if (end < start) return FAIL('Tanggal selesai tidak boleh sebelum tanggal mulai.');
  if (input.reason.trim().length < 6) return FAIL('Alasan minimal 6 karakter.');

  const days = hariKerja(start, end);

  // Sisa kuota cuti tahunan.
  if (input.type === 'ANNUAL') {
    const emp = await prisma.employee.findUnique({
      where: { id: input.employeeId },
      select: { annualLeaveQuota: true },
    });
    const terpakai = await prisma.leaveRequest.aggregate({
      where: {
        employeeId: input.employeeId,
        type: 'ANNUAL',
        status: 'APPROVED',
        startDate: { gte: kalender(`${isoTanggal().slice(0, 4)}-01-01`) },
      },
      _sum: { days: true },
    });
    const sisa = (emp?.annualLeaveQuota ?? 12) - (terpakai._sum.days ?? 0);
    if (days > sisa) {
      return FAIL(
        `Sisa kuota cuti tahunan tinggal ${sisa} hari, pengajuan ${days} hari melebihi kuota.`,
      );
    }
  }

  // Tumpang tindih dengan pengajuan yang masih hidup.
  const tumpang = await prisma.leaveRequest.findFirst({
    where: {
      employeeId: input.employeeId,
      status: { in: ['PENDING', 'APPROVED'] },
      startDate: { lte: end },
      endDate: { gte: start },
    },
    select: { startDate: true, endDate: true },
  });
  if (tumpang) {
    return FAIL(
      `Sudah ada pengajuan pada ${tanggal(tumpang.startDate)} – ${tanggal(tumpang.endDate)}.`,
    );
  }

  const req = await prisma.leaveRequest.create({
    data: {
      employeeId: input.employeeId,
      type: input.type,
      startDate: start,
      endDate: end,
      days,
      reason: input.reason.trim(),
    },
  });

  await audit(aktor as Session, 'CREATE', 'LeaveRequest', req.id, `Pengajuan cuti ${days} hari dibuat`);
  await kabariPengelola(
    'Pengajuan cuti baru',
    `${aktor.name} mengajukan cuti ${days} hari.`,
    '/leave',
  );

  return OK(`Pengajuan cuti ${days} hari kerja terkirim.`);
}

// ──────────────────────────── Lembur ────────────────────────────

export interface InputLembur {
  employeeId: string;
  date: string;
  hours: number;
  reason: string;
}

export async function ajukanLembur(aktor: Aktor, input: InputLembur): Promise<ActionState> {
  if (!bisaKelola(aktor.role) && input.employeeId !== aktor.employeeId) {
    return FAIL('Anda hanya bisa mengajukan lembur untuk diri sendiri.');
  }

  let date: Date;
  try {
    date = kalender(input.date);
  } catch {
    return FAIL('Tanggal tidak terbaca.');
  }
  if (!(input.hours > 0)) return FAIL('Jumlah jam lembur harus lebih dari nol.');
  if (input.hours > 12) return FAIL('Lembur lebih dari 12 jam sehari tidak wajar, periksa lagi.');
  if (input.reason.trim().length < 6) return FAIL('Alasan minimal 6 karakter.');

  const isHoliday = akhirPekan(date);

  const ada = await prisma.overtime.findFirst({
    where: { employeeId: input.employeeId, date, status: { in: ['PENDING', 'APPROVED'] } },
    select: { id: true },
  });
  if (ada) return FAIL('Sudah ada pengajuan lembur untuk tanggal tersebut.');

  const req = await prisma.overtime.create({
    data: {
      employeeId: input.employeeId,
      date,
      hours: input.hours,
      isHoliday,
      reason: input.reason.trim(),
    },
  });

  await audit(aktor as Session, 'CREATE', 'Overtime', req.id, `Pengajuan lembur ${input.hours} jam dibuat`);
  await kabariPengelola(
    'Pengajuan lembur baru',
    `${aktor.name} mengajukan lembur ${input.hours} jam.`,
    '/overtime',
  );

  return OK(`Pengajuan lembur ${input.hours} jam terkirim.`);
}

/**
 * Upah sebulan seorang karyawan sebagai dasar perhitungan lembur.
 *
 * Memakai penyelesai komponen yang sama dengan mesin gaji, termasuk penyaring
 * cakupan per departemen dan tingkat jabatan, supaya angka yang disebut saat
 * menyetujui benar-benar angka yang nanti dibayarkan.
 *
 * Komponen berumus dilewati: nilainya bergantung kehadiran, sehingga belum
 * diketahui saat lembur diajukan maupun disetujui. Mesin gaji menandainya
 * sebagai bukan tunjangan tetap, jadi keduanya sepakat.
 */
export async function upahLemburKaryawan(employeeId: string): Promise<number> {
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      baseSalary: true,
      departmentId: true,
      position: { select: { level: true } },
      components: { include: { component: true } },
    },
  });
  if (!emp) return 0;

  const ctx = {
    departmentId: emp.departmentId,
    level: emp.position?.level ?? null,
    baseSalary: emp.baseSalary,
    // Tidak ada rumus yang dievaluasi di sini, jadi variabelnya tidak terpakai.
    variables: {} as never,
  };

  return upahDasarLembur(emp.baseSalary, tunjanganTetap(emp.components, ctx));
}

/**
 * Nilai rupiah lembur seorang karyawan.
 *
 * Satu-satunya tempat perhitungan ini dilakukan di luar mesin gaji, dipakai
 * oleh pratinjau sebelum mengajukan, pratinjau antrean HR, dan penguncian
 * nilai saat persetujuan. Memakai dasar upah dan aturan divisi yang sama
 * dengan mesin gaji, supaya angka yang disebut sama dengan yang dibayarkan.
 */
export async function nilaiLembur(
  employeeId: string,
  jam: number,
  hariLibur: boolean,
): Promise<{ amount: number; detail: string[] }> {
  const [upah, emp] = await Promise.all([
    upahLemburKaryawan(employeeId),
    prisma.employee.findUnique({
      where: { id: employeeId },
      select: { departmentId: true, position: { select: { level: true } } },
    }),
  ]);
  if (!upah) return { amount: 0, detail: [] };

  const aturan = await prisma.policyRule.findMany({ where: { kind: 'OVERTIME', active: true } });
  const config = overtimeConfigDari(
    pilihAturan(aturan, 'OVERTIME', emp?.departmentId ?? null, emp?.position?.level ?? null),
  );

  return hitungUpahLembur(upah, hariLibur ? 0 : jam, hariLibur ? jam : 0, config);
}

/** Perkiraan rupiah lembur, untuk ditampilkan sebelum karyawan mengirim. */
export async function perkiraanLembur(employeeId: string, hours: number, date: string) {
  return (await nilaiLembur(employeeId, hours, akhirPekan(kalender(date)))).amount;
}

// ─────────────────────────── Kehadiran ───────────────────────────

/**
 * Absen masuk / pulang.
 *
 * Waktunya diambil dari jam server, bukan dari jam perangkat. Jam ponsel bisa
 * diubah pemiliknya, dan potongan keterlambatan dihitung dari data ini.
 */
export async function absen(aktor: Aktor, kind: 'IN' | 'OUT'): Promise<ActionState> {
  if (!aktor.employeeId) return FAIL('Akun ini tidak tertaut ke data karyawan.');

  const now = new Date();
  const today = hariIni(now);

  const setting = await prisma.companySetting.findUnique({ where: { id: 'singleton' } });
  const [jamMulai, menitMulai] = (setting?.workStart ?? '09:00').split(':').map(Number);
  const toleransi = setting?.lateToleranceMin ?? 15;

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: aktor.employeeId, date: today } },
  });

  if (kind === 'IN') {
    if (existing?.clockIn) return FAIL('Anda sudah absen masuk hari ini.');

    // Ambang ditafsirkan menurut zona perusahaan. Memakai setHours() akan
    // mengikuti zona server — di server UTC, pukul 09.15 menjadi 16.15 WIB.
    const batas = pukul(today, jamMulai, menitMulai + toleransi);
    const telat = now > batas ? Math.round((now.getTime() - batas.getTime()) / 60000) : 0;

    await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: aktor.employeeId, date: today } },
      create: {
        employeeId: aktor.employeeId,
        date: today,
        clockIn: now,
        status: telat > 0 ? 'LATE' : 'PRESENT',
        lateMinutes: telat,
      },
      update: { clockIn: now, status: telat > 0 ? 'LATE' : 'PRESENT', lateMinutes: telat },
    });

    await audit(aktor as Session, 'CREATE', 'Attendance', null, `${aktor.name} absen masuk`);
    return OK(
      telat > 0
        ? `Absen masuk tercatat — terlambat ${telat} menit.`
        : 'Absen masuk tercatat. Selamat bekerja.',
    );
  }

  if (!existing?.clockIn) return FAIL('Anda belum absen masuk hari ini.');
  if (existing.clockOut) return FAIL('Anda sudah absen pulang hari ini.');

  const menitKerja = Math.round((now.getTime() - existing.clockIn.getTime()) / 60000);
  await prisma.attendance.update({
    where: { id: existing.id },
    data: { clockOut: now, workMinutes: menitKerja },
  });

  await audit(aktor as Session, 'UPDATE', 'Attendance', existing.id, `${aktor.name} absen pulang`);
  const jam = Math.floor(menitKerja / 60);
  return OK(`Absen pulang tercatat. Total kerja ${jam} jam ${menitKerja % 60} menit.`);
}

/** Keadaan absensi hari ini — dipakai untuk menentukan tombol yang tampil. */
export async function absensiHariIni(employeeId: string) {
  const today = hariIni();
  const a = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });
  return {
    sudahMasuk: !!a?.clockIn,
    sudahPulang: !!a?.clockOut,
    clockIn: a?.clockIn?.toISOString() ?? null,
    clockOut: a?.clockOut?.toISOString() ?? null,
    status: a?.status ?? null,
    lateMinutes: a?.lateMinutes ?? 0,
    workMinutes: a?.workMinutes ?? 0,
  };
}

/** Sisa kuota cuti tahunan berjalan. */
export async function sisaKuotaCuti(employeeId: string) {
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { annualLeaveQuota: true },
  });
  const terpakai = await prisma.leaveRequest.aggregate({
    where: {
      employeeId,
      type: 'ANNUAL',
      status: 'APPROVED',
      startDate: { gte: kalender(`${isoTanggal().slice(0, 4)}-01-01`) },
    },
    _sum: { days: true },
  });
  const kuota = emp?.annualLeaveQuota ?? 12;
  const pakai = terpakai._sum.days ?? 0;
  return { kuota, terpakai: pakai, sisa: Math.max(0, kuota - pakai) };
}
