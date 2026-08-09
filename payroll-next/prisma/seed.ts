/**
 * Seed Racik — data demo yang realistis.
 *
 * Menghasilkan: 1 perusahaan, 6 departemen, 14 posisi, 26 karyawan,
 * komponen gaji, ~4 bulan kehadiran, cuti, lembur, pinjaman, dan
 * 3 periode payroll yang sudah dibayar + 1 periode berjalan.
 */

import { PrismaClient } from '@prisma/client';
import { akhirPekan, dariYMD, hariIni as hariIniKalender, pukul, tambahHari } from '../src/lib/waktu';
import bcrypt from 'bcryptjs';
import { calculatePayroll, upahDasarLembur, workingDaysInPeriod } from '../src/lib/payroll-engine';
import { tunjanganTetap } from '../src/lib/components';
import { OVERTIME_DEFAULT, hitungUpahLembur, overtimeConfigDari, pilihAturan } from '../src/lib/policy';
import { resolveAll, buildVariables } from '../src/lib/components';
import { hitungThr, masaKerjaBulan, pajakThr } from '../src/lib/thr';
import { pph21Ter } from '../src/lib/tax';
import type { PtkpStatus } from '../src/lib/tax';

const prisma = new PrismaClient();

// PRNG deterministik supaya setiap `db:seed` menghasilkan data yang sama.
let seed = 20250412;
function rnd() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const between = (a: number, b: number) => Math.floor(rnd() * (b - a + 1)) + a;

const DEPARTEMEN = [
  { code: 'ENG', name: 'Teknologi', costCenter: 'CC-100' },
  { code: 'PRD', name: 'Produk & Desain', costCenter: 'CC-200' },
  { code: 'FIN', name: 'Keuangan', costCenter: 'CC-300' },
  { code: 'HRD', name: 'Sumber Daya Manusia', costCenter: 'CC-400' },
  { code: 'MKT', name: 'Pemasaran', costCenter: 'CC-500' },
  { code: 'OPS', name: 'Operasional', costCenter: 'CC-600' },
];

const POSISI: { dept: string; title: string; level: string; min: number; max: number }[] = [
  { dept: 'ENG', title: 'Backend Engineer', level: 'STAFF', min: 9_000_000, max: 16_000_000 },
  { dept: 'ENG', title: 'Frontend Engineer', level: 'STAFF', min: 9_000_000, max: 15_500_000 },
  { dept: 'ENG', title: 'Engineering Lead', level: 'LEAD', min: 22_000_000, max: 34_000_000 },
  { dept: 'ENG', title: 'QA Engineer', level: 'STAFF', min: 7_500_000, max: 12_000_000 },
  { dept: 'PRD', title: 'Product Manager', level: 'MANAGER', min: 18_000_000, max: 28_000_000 },
  { dept: 'PRD', title: 'UI/UX Designer', level: 'STAFF', min: 8_500_000, max: 14_000_000 },
  { dept: 'FIN', title: 'Staf Akuntansi', level: 'STAFF', min: 6_500_000, max: 10_000_000 },
  { dept: 'FIN', title: 'Finance Manager', level: 'MANAGER', min: 20_000_000, max: 30_000_000 },
  { dept: 'HRD', title: 'HR Generalist', level: 'STAFF', min: 7_000_000, max: 11_000_000 },
  { dept: 'HRD', title: 'HR Manager', level: 'MANAGER', min: 18_000_000, max: 26_000_000 },
  { dept: 'MKT', title: 'Digital Marketing', level: 'STAFF', min: 6_500_000, max: 11_000_000 },
  { dept: 'MKT', title: 'Marketing Lead', level: 'LEAD', min: 16_000_000, max: 24_000_000 },
  { dept: 'OPS', title: 'Staf Operasional', level: 'STAFF', min: 5_500_000, max: 8_500_000 },
  { dept: 'OPS', title: 'Direktur Operasional', level: 'DIRECTOR', min: 40_000_000, max: 60_000_000 },
];

const ORANG: { nama: string; posisi: string; gaji: number; ptkp: PtkpStatus; gender: string }[] = [
  { nama: 'Adit Nugroho Prakoso', posisi: 'Direktur Operasional', gaji: 52_000_000, ptkp: 'K/3', gender: 'M' },
  { nama: 'Rani Kusumawardani', posisi: 'Engineering Lead', gaji: 29_500_000, ptkp: 'K/1', gender: 'F' },
  { nama: 'Bagas Setiawan', posisi: 'Backend Engineer', gaji: 14_200_000, ptkp: 'TK/0', gender: 'M' },
  { nama: 'Dinda Ayu Lestari', posisi: 'Frontend Engineer', gaji: 13_400_000, ptkp: 'TK/0', gender: 'F' },
  { nama: 'Fajar Ramadhan', posisi: 'Backend Engineer', gaji: 11_800_000, ptkp: 'K/0', gender: 'M' },
  { nama: 'Sekar Ayuningtyas', posisi: 'Frontend Engineer', gaji: 10_900_000, ptkp: 'TK/1', gender: 'F' },
  { nama: 'Yoga Pratama Wibowo', posisi: 'QA Engineer', gaji: 9_600_000, ptkp: 'TK/0', gender: 'M' },
  { nama: 'Nabila Rahmawati', posisi: 'QA Engineer', gaji: 8_400_000, ptkp: 'TK/0', gender: 'F' },
  { nama: 'Reza Aditya Kurnia', posisi: 'Backend Engineer', gaji: 12_600_000, ptkp: 'K/2', gender: 'M' },
  { nama: 'Kirana Maheswari', posisi: 'Product Manager', gaji: 24_500_000, ptkp: 'K/1', gender: 'F' },
  { nama: 'Bimo Aryasatya', posisi: 'UI/UX Designer', gaji: 12_100_000, ptkp: 'TK/0', gender: 'M' },
  { nama: 'Tiara Hapsari Putri', posisi: 'UI/UX Designer', gaji: 10_300_000, ptkp: 'TK/0', gender: 'F' },
  { nama: 'Hendra Wijaya Kusuma', posisi: 'Finance Manager', gaji: 26_000_000, ptkp: 'K/2', gender: 'M' },
  { nama: 'Maya Anggraini', posisi: 'Staf Akuntansi', gaji: 8_200_000, ptkp: 'TK/0', gender: 'F' },
  { nama: 'Galih Saputra', posisi: 'Staf Akuntansi', gaji: 7_400_000, ptkp: 'TK/1', gender: 'M' },
  { nama: 'Larasati Widyaningrum', posisi: 'HR Manager', gaji: 22_800_000, ptkp: 'K/1', gender: 'F' },
  { nama: 'Anggun Puspita Sari', posisi: 'HR Generalist', gaji: 9_100_000, ptkp: 'TK/0', gender: 'F' },
  { nama: 'Damar Prasetyo', posisi: 'HR Generalist', gaji: 8_000_000, ptkp: 'K/0', gender: 'M' },
  { nama: 'Rizky Ardiansyah', posisi: 'Marketing Lead', gaji: 19_500_000, ptkp: 'K/0', gender: 'M' },
  { nama: 'Salsabila Nur Aisyah', posisi: 'Digital Marketing', gaji: 8_800_000, ptkp: 'TK/0', gender: 'F' },
  { nama: 'Ilham Maulana Yusuf', posisi: 'Digital Marketing', gaji: 7_600_000, ptkp: 'TK/0', gender: 'M' },
  { nama: 'Citra Dewi Anjani', posisi: 'Digital Marketing', gaji: 9_200_000, ptkp: 'TK/2', gender: 'F' },
  { nama: 'Arif Budiman Santoso', posisi: 'Staf Operasional', gaji: 6_800_000, ptkp: 'K/1', gender: 'M' },
  { nama: 'Wulan Safitri', posisi: 'Staf Operasional', gaji: 6_200_000, ptkp: 'TK/0', gender: 'F' },
  { nama: 'Panji Kurniawan', posisi: 'Staf Operasional', gaji: 5_900_000, ptkp: 'TK/0', gender: 'M' },
  { nama: 'Melati Ramadhani Putri', posisi: 'Backend Engineer', gaji: 10_400_000, ptkp: 'TK/0', gender: 'F' },
];

const BANK = ['BCA', 'Bank Mandiri', 'BNI', 'BRI', 'Bank Jago', 'CIMB Niaga'];

const KOMPONEN = [
  { code: 'TJ-TRANS', name: 'Tunjangan Transportasi', type: 'ALLOWANCE', calcType: 'FIXED', amount: 750_000, percent: 0, formula: null, taxable: true, countsForBpjs: true, prorate: true, isDefault: true, sortOrder: 10, note: 'Dibayar per hari kerja, jadi diprorata bila masuk tengah bulan' },
  { code: 'TJ-MAKAN', name: 'Tunjangan Makan', type: 'ALLOWANCE', calcType: 'FORMULA', amount: 0, percent: 0, formula: 'HARI_HADIR * 45000', taxable: true, countsForBpjs: false, prorate: false, isDefault: true, sortOrder: 20, note: 'Rp 45.000 per hari kehadiran — ikut naik-turun dengan absensi' },
  { code: 'TJ-JABAT', name: 'Tunjangan Jabatan', type: 'ALLOWANCE', calcType: 'PERCENT_OF_BASE', amount: 0, percent: 12.5, formula: null, taxable: true, countsForBpjs: true, prorate: true, isDefault: false, sortOrder: 5, note: null },
  { code: 'TJ-KOMUN', name: 'Tunjangan Komunikasi', type: 'ALLOWANCE', calcType: 'FIXED', amount: 350_000, percent: 0, formula: null, taxable: true, countsForBpjs: false, prorate: false, isDefault: true, sortOrder: 30, note: null },
  { code: 'TJ-MASKER', name: 'Tunjangan Masa Kerja', type: 'ALLOWANCE', calcType: 'FORMULA', amount: 0, percent: 0, formula: 'MIN(FLOOR(MASA_KERJA_BULAN / 12) * 250000; 2000000)', taxable: true, countsForBpjs: false, prorate: false, isDefault: false, sortOrder: 40, note: 'Rp 250.000 per tahun masa kerja, maksimal Rp 2 juta' },
  { code: 'TJ-KESEH', name: 'Tunjangan Kesehatan Keluarga', type: 'ALLOWANCE', calcType: 'FORMULA', amount: 0, percent: 0, formula: 'IF(JUMLAH_TANGGUNGAN > 0; 300000 + JUMLAH_TANGGUNGAN * 150000; 0)', taxable: false, countsForBpjs: false, prorate: false, isDefault: false, sortOrder: 50, note: 'Naik mengikuti jumlah tanggungan pada status PTKP' },
  { code: 'TJ-WFH', name: 'Tunjangan Kerja Jarak Jauh', type: 'ALLOWANCE', calcType: 'FIXED', amount: 400_000, percent: 0, formula: null, taxable: false, countsForBpjs: false, prorate: false, isDefault: false, sortOrder: 60, note: null },
  { code: 'PT-KOPER', name: 'Iuran Koperasi Karyawan', type: 'DEDUCTION', calcType: 'FIXED', amount: 100_000, percent: 0, formula: null, taxable: false, countsForBpjs: false, prorate: false, isDefault: true, sortOrder: 70, note: null },
  { code: 'PT-TELAT', name: 'Potongan Keterlambatan', type: 'DEDUCTION', calcType: 'FORMULA', amount: 0, percent: 0, formula: 'IF(MENIT_TELAT > 30; (MENIT_TELAT - 30) * 2500; 0)', taxable: false, countsForBpjs: false, prorate: false, isDefault: false, sortOrder: 80, note: 'Toleransi 30 menit, lebih dari itu Rp 2.500 per menit' },
  { code: 'PT-SERIK', name: 'Iuran Serikat Pekerja', type: 'DEDUCTION', calcType: 'FIXED', amount: 50_000, percent: 0, formula: null, taxable: false, countsForBpjs: false, prorate: false, isDefault: false, sortOrder: 90, note: null },
];

const TAHAP_PERSETUJUAN = [
  { sortOrder: 1, name: 'Diperiksa Staf HR', role: 'HR', note: 'Memastikan data kehadiran dan lembur sudah lengkap' },
  { sortOrder: 2, name: 'Disetujui Manajer HR', role: 'HR', note: 'Memeriksa kewajaran angka per karyawan' },
  { sortOrder: 3, name: 'Dirilis Direktur Keuangan', role: 'ADMIN', note: 'Persetujuan akhir sebelum dana ditransfer' },
];

const KOLOM_SLIP = [
  { key: 'nama', label: 'Nama karyawan', section: 'IDENTITAS', sortOrder: 10, visible: true },
  { key: 'nomor', label: 'Nomor induk', section: 'IDENTITAS', sortOrder: 20, visible: true },
  { key: 'jabatan', label: 'Jabatan', section: 'IDENTITAS', sortOrder: 30, visible: true },
  { key: 'departemen', label: 'Departemen', section: 'IDENTITAS', sortOrder: 40, visible: true },
  { key: 'ptkp', label: 'Status PTKP', section: 'IDENTITAS', sortOrder: 50, visible: true },
  { key: 'npwp', label: 'NPWP', section: 'IDENTITAS', sortOrder: 60, visible: true },
  { key: 'rekening', label: 'Nomor rekening', section: 'IDENTITAS', sortOrder: 70, visible: true },
  { key: 'kehadiran', label: 'Ringkasan kehadiran', section: 'IDENTITAS', sortOrder: 80, visible: true },
  { key: 'rincian_terima', label: 'Rincian penerimaan', section: 'PENERIMAAN', sortOrder: 10, visible: true },
  { key: 'rincian_potong', label: 'Rincian potongan', section: 'POTONGAN', sortOrder: 10, visible: true },
  { key: 'dasar_pajak', label: 'Dasar perhitungan PPh 21', section: 'PAJAK', sortOrder: 10, visible: true },
  { key: 'iuran_perusahaan', label: 'Iuran ditanggung perusahaan', section: 'PERUSAHAAN', sortOrder: 10, visible: true },
  { key: 'terbilang', label: 'Terbilang', section: 'CATATAN', sortOrder: 10, visible: true },
  { key: 'catatan_kaki', label: 'Catatan kaki & tanda tangan', section: 'CATATAN', sortOrder: 20, visible: true },
];

const FORMAT_BANK = [
  {
    name: 'BCA — Mass Transfer',
    delimiter: ',',
    includeHeader: false,
    isDefault: true,
    columns: JSON.stringify([
      { header: 'Rekening Tujuan', source: 'bankAccount', prefix: "'" },
      { header: 'Nama Penerima', source: 'bankHolder', prefix: '' },
      { header: 'Nominal', source: 'netPay', prefix: '' },
      { header: 'Berita', source: 'period', prefix: 'GAJI ' },
    ]),
  },
  {
    name: 'Mandiri — Bulk Payment',
    delimiter: ';',
    includeHeader: true,
    isDefault: false,
    columns: JSON.stringify([
      { header: 'NO', source: 'rowNumber', prefix: '' },
      { header: 'NIK', source: 'employeeNo', prefix: '' },
      { header: 'NAMA', source: 'bankHolder', prefix: '' },
      { header: 'BANK', source: 'bankName', prefix: '' },
      { header: 'NOREK', source: 'bankAccount', prefix: "'" },
      { header: 'AMOUNT', source: 'netPay', prefix: '' },
      { header: 'REMARK', source: 'period', prefix: 'PAYROLL ' },
    ]),
  },
];

function periodeMundur(n: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Mengisi ulang seluruh data contoh, dari nol.
 *
 * Diekspor supaya bisa dipanggil dari dua tempat: skrip baris perintah untuk
 * pengembangan, dan rute pengaturan ulang demo yang berjalan terjadwal. Yang
 * kedua itulah alasan fungsi ini tidak lagi memanggil process.exit — mematikan
 * proses di dalam fungsi tanpa peladen akan menjatuhkan seluruh permintaan.
 */
export async function jalankanSeed() {
  console.log('› Membersihkan basis data…');
  // Jejak persetujuan dulu, karena menunjuk ke proses gaji dan tahapnya.
  await prisma.runApproval.deleteMany();
  await prisma.payrollItem.deleteMany();
  await prisma.payrollRun.deleteMany();
  await prisma.approvalStep.deleteMany();
  await prisma.payslipField.deleteMany();
  await prisma.bankFormat.deleteMany();
  await prisma.policyRule.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.overtime.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.employeeComponent.deleteMany();
  await prisma.salaryComponent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.position.deleteMany();
  await prisma.department.deleteMany();
  await prisma.companySetting.deleteMany();

  console.log('› Profil perusahaan…');
  const company = await prisma.companySetting.create({ data: { id: 'singleton' } });

  console.log('› Departemen & posisi…');
  const deptMap: Record<string, string> = {};
  for (const d of DEPARTEMEN) {
    const rec = await prisma.department.create({ data: d });
    deptMap[d.code] = rec.id;
  }

  const posMap: Record<string, { id: string; deptId: string }> = {};
  for (const p of POSISI) {
    const rec = await prisma.position.create({
      data: {
        title: p.title,
        level: p.level,
        departmentId: deptMap[p.dept],
        minSalary: p.min,
        maxSalary: p.max,
      },
    });
    posMap[p.title] = { id: rec.id, deptId: deptMap[p.dept] };
  }

  console.log('› Komponen gaji…');
  const komponen = [];
  for (const k of KOMPONEN) komponen.push(await prisma.salaryComponent.create({ data: k }));

  console.log('› Alur persetujuan, kolom slip, format bank, aturan divisi…');
  for (const t of TAHAP_PERSETUJUAN) await prisma.approvalStep.create({ data: t });
  for (const k of KOLOM_SLIP) await prisma.payslipField.create({ data: k });
  for (const f of FORMAT_BANK) await prisma.bankFormat.create({ data: f });

  // Aturan yang sengaja dibuat berbeda antar divisi, untuk menunjukkan
  // bahwa satu perusahaan bisa punya kebijakan majemuk dalam satu sistem.
  await prisma.policyRule.create({
    data: {
      name: 'Keterlambatan — aturan umum',
      kind: 'LATE',
      priority: 0,
      config: JSON.stringify({ toleransiMenit: 30, potonganPerMenit: 2500, potonganMaksPerBulan: 500000 }),
    },
  });
  await prisma.policyRule.create({
    data: {
      name: 'Keterlambatan — Operasional lebih ketat',
      kind: 'LATE',
      priority: 10,
      scopeDepartmentId: deptMap['OPS'],
      config: JSON.stringify({ toleransiMenit: 10, potonganPerMenit: 4000, potonganMaksPerBulan: 750000 }),
    },
  });
  await prisma.policyRule.create({
    data: {
      name: 'Keterlambatan — Direktur dikecualikan',
      kind: 'LATE',
      priority: 20,
      scopeLevel: 'DIRECTOR',
      config: JSON.stringify({ toleransiMenit: 0, potonganPerMenit: 0, potonganMaksPerBulan: 0 }),
    },
  });
  await prisma.policyRule.create({
    data: {
      name: 'Lembur — pengganda Kepmenaker',
      kind: 'OVERTIME',
      priority: 0,
      config: JSON.stringify({ metode: 'KEPMENAKER', pembagi: 173 }),
    },
  });
  await prisma.policyRule.create({
    data: {
      name: 'Lembur — Teknologi tarif rata',
      kind: 'OVERTIME',
      priority: 10,
      scopeDepartmentId: deptMap['ENG'],
      config: JSON.stringify({ metode: 'FLAT', tarifPerJam: 75000 }),
    },
  });

  console.log('› Akun & karyawan…');
  const pass = await bcrypt.hash('password123', 10);

  await prisma.user.create({
    data: {
      email: 'admin@racik.id',
      name: 'Zainul Arkaan',
      password: pass,
      role: 'ADMIN',
      avatarHue: 158,
    },
  });

  const employees: { id: string; gaji: number; ptkp: PtkpStatus; joinDate: Date }[] = [];

  for (let i = 0; i < ORANG.length; i++) {
    const o = ORANG[i];
    const pos = posMap[o.posisi];
    const nomor = `ND-${String(i + 1).padStart(4, '0')}`;
    const email = o.nama.toLowerCase().split(' ')[0] + '.' + o.nama.toLowerCase().split(' ').slice(-1)[0] + '@nusantaradigital.id';

    const tahunGabung = between(2019, 2024);
    const joinDate = dariYMD(tahunGabung, between(0, 11) + 1, between(1, 28));

    // HR Manager dapat akun HR, sisanya akun karyawan biasa.
    const role = o.posisi === 'HR Manager' ? 'HR' : 'EMPLOYEE';
    const user = await prisma.user.create({
      data: {
        email,
        name: o.nama,
        password: pass,
        role,
        avatarHue: between(0, 359),
      },
    });

    const emp = await prisma.employee.create({
      data: {
        employeeNo: nomor,
        userId: user.id,
        fullName: o.nama,
        email,
        phone: `08${between(10, 99)}${between(10000000, 99999999)}`,
        nik: `31${between(70, 79)}${between(100000000000, 999999999999)}`,
        // ~15% karyawan sengaja tidak punya NPWP → kena tarif PPh +20%
        npwp: rnd() > 0.15 ? `${between(10, 99)}.${between(100, 999)}.${between(100, 999)}.${between(1, 9)}-${between(100, 999)}.000` : null,
        birthDate: dariYMD(between(1985, 2001), between(0, 11) + 1, between(1, 28)),
        gender: o.gender,
        address: `Jl. ${pick(['Melati', 'Kenanga', 'Cendana', 'Anggrek', 'Bougenville'])} No. ${between(1, 99)}, ${pick(['Jakarta Selatan', 'Depok', 'Tangerang Selatan', 'Bekasi', 'Bogor'])}`,
        departmentId: pos.deptId,
        positionId: pos.id,
        joinDate,
        employmentType: rnd() > 0.2 ? 'PERMANENT' : 'CONTRACT',
        status: 'ACTIVE',
        baseSalary: o.gaji,
        ptkpStatus: o.ptkp,
        bankName: pick(BANK),
        bankAccount: `${between(1000000000, 9999999999)}`,
        bankHolder: o.nama,
        bpjsKesehatanNo: `000${between(1000000000, 9999999999)}`,
        bpjsTkNo: `2${between(10000000000, 99999999999)}`,
        annualLeaveQuota: 12,
      },
    });

    employees.push({ id: emp.id, gaji: o.gaji, ptkp: o.ptkp, joinDate });

    // komponen default + tunjangan jabatan untuk level atas
    const wajib = komponen.filter((k) => k.isDefault);
    for (const k of wajib) {
      await prisma.employeeComponent.create({ data: { employeeId: emp.id, componentId: k.id } });
    }
    const posisiInfo = POSISI.find((p) => p.title === o.posisi)!;
    if (['LEAD', 'MANAGER', 'DIRECTOR'].includes(posisiInfo.level)) {
      const jabat = komponen.find((k) => k.code === 'TJ-JABAT')!;
      await prisma.employeeComponent.create({ data: { employeeId: emp.id, componentId: jabat.id } });
    }
    if (rnd() > 0.6) {
      const kes = komponen.find((k) => k.code === 'TJ-KESEH')!;
      await prisma.employeeComponent.create({ data: { employeeId: emp.id, componentId: kes.id } });
    }
    if (rnd() > 0.7) {
      const wfh = komponen.find((k) => k.code === 'TJ-WFH')!;
      await prisma.employeeComponent.create({ data: { employeeId: emp.id, componentId: wfh.id } });
    }
  }

  // Satu kasus pelanggaran PP 36/2021 yang sengaja ditanam pada data demo.
  // Polanya nyata: perusahaan menahan gaji pokok tetap rendah lalu
  // membesarkan tunjangan tetap, sehingga dasar pengali BPJS dan
  // perhitungan pesangon ikut mengecil. Aturan 75% melarang persis ini.
  const contohPelanggaran = employees.find((e) => e.gaji < 7_000_000);
  const komun = komponen.find((k) => k.code === 'TJ-KOMUN');
  if (contohPelanggaran && komun) {
    await prisma.employeeComponent.upsert({
      where: {
        employeeId_componentId: { employeeId: contohPelanggaran.id, componentId: komun.id },
      },
      create: { employeeId: contohPelanggaran.id, componentId: komun.id, overrideAmount: 3_000_000 },
      update: { overrideAmount: 3_000_000 },
    });
  }

  console.log('› Pinjaman karyawan…');
  for (let i = 0; i < 4; i++) {
    const e = employees[between(0, employees.length - 1)];
    const principal = between(5, 25) * 1_000_000;
    const tenor = pick([6, 10, 12, 18, 24]);
    await prisma.loan.create({
      data: {
        employeeId: e.id,
        principal,
        tenorMonths: tenor,
        monthlyDeduction: Math.round(principal / tenor),
        remaining: Math.round((principal / tenor) * between(2, tenor)),
        startPeriod: periodeMundur(between(3, 10)),
        status: 'ACTIVE',
        note: pick(['Renovasi rumah', 'Biaya pendidikan anak', 'Kebutuhan keluarga', 'Pembelian kendaraan']),
      },
    });
  }

  console.log('› Kehadiran 4 bulan terakhir…');
  const attendanceRows: any[] = [];
  for (let back = 3; back >= 0; back--) {
    const [y, m] = periodeMundur(back).split('-').map(Number);
    const jumlahHari = new Date(y, m, 0).getDate();

    for (const e of employees) {
      for (let d = 1; d <= jumlahHari; d++) {
        const date = dariYMD(y, m, d);
        if (date > new Date()) break;
        const dow = date.getUTCDay();
        if (dow === 0 || dow === 6) continue;
        if (date < e.joinDate) continue;

        const r = rnd();
        let status = 'PRESENT';
        let clockIn: Date | null = null;
        let clockOut: Date | null = null;
        let lateMinutes = 0;
        let workMinutes = 0;

        if (r < 0.025) {
          status = 'ABSENT';
        } else if (r < 0.06) {
          status = 'LEAVE';
        } else {
          const wfh = rnd() < 0.22;
          const telat = rnd() < 0.18 ? between(5, 65) : 0;
          const masuk = pukul(dariYMD(y, m, d), 9, telat);
          const durasi = between(505, 600); // 8j25m – 10j
          const pulang = new Date(masuk.getTime() + durasi * 60000);
          clockIn = masuk;
          clockOut = pulang;
          workMinutes = durasi;
          lateMinutes = Math.max(0, telat - company.lateToleranceMin);
          status = wfh ? 'WFH' : lateMinutes > 0 ? 'LATE' : 'PRESENT';
        }

        attendanceRows.push({
          employeeId: e.id,
          date,
          clockIn,
          clockOut,
          status,
          lateMinutes,
          workMinutes,
        });
      }
    }
  }
  // createMany jauh lebih cepat daripada ribuan create satu-satu
  for (let i = 0; i < attendanceRows.length; i += 500) {
    await prisma.attendance.createMany({ data: attendanceRows.slice(i, i + 500) });
  }
  console.log(`  ${attendanceRows.length} baris kehadiran`);

  console.log('› Lembur…');

  // Dasar upah lembur per karyawan, memakai fungsi yang sama dengan mesin gaji
  // dan dengan persetujuan di aplikasi — bukan gaji pokok saja.
  const aturanLembur = await prisma.policyRule.findMany({ where: { kind: 'OVERTIME', active: true } });
  const upahLemburPer = new Map<string, number>();
  const konfigLembur = new Map<string, ReturnType<typeof overtimeConfigDari>>();
  for (const e of employees) {
    const asg = await prisma.employeeComponent.findMany({
      where: { employeeId: e.id },
      include: { component: true },
    });
    const emp = await prisma.employee.findUnique({
      where: { id: e.id },
      select: { departmentId: true, position: { select: { level: true } } },
    });
    const ctx = {
      departmentId: emp?.departmentId ?? null,
      level: emp?.position?.level ?? null,
      baseSalary: e.gaji,
      variables: {} as never,
    };
    upahLemburPer.set(e.id, upahDasarLembur(e.gaji, tunjanganTetap(asg, ctx)));
    konfigLembur.set(
      e.id,
      overtimeConfigDari(pilihAturan(aturanLembur, 'OVERTIME', ctx.departmentId, ctx.level)),
    );
  }

  const overtimeRows: any[] = [];
  for (let back = 3; back >= 0; back--) {
    const [y, m] = periodeMundur(back).split('-').map(Number);
    for (let n = 0; n < 18; n++) {
      const e = employees[between(0, employees.length - 1)];
      const d = between(1, 26);
      const date = dariYMD(y, m, d);
      if (date > new Date() || date < e.joinDate) continue;
      const isHoliday = akhirPekan(date);
      const hours = between(2, 8) / 2 + 1;
      const status = back === 0 && rnd() < 0.45 ? 'PENDING' : rnd() < 0.9 ? 'APPROVED' : 'REJECTED';
      overtimeRows.push({
        employeeId: e.id,
        date,
        hours,
        isHoliday,
        reason: pick([
          'Rilis fitur ke produksi',
          'Menyelesaikan tutup buku bulanan',
          'Perbaikan insiden produksi',
          'Persiapan audit internal',
          'Menyiapkan materi kampanye',
          'Migrasi basis data',
        ]),
        status,
        reviewedAt: status === 'PENDING' ? null : new Date(y, m - 1, Math.min(28, d + 2)),
        // Nilainya dikunci saat disetujui, sama seperti yang dilakukan
        // reviewOvertime() di aplikasi. Tanpa ini, lembur yang sudah disetujui
        // tercatat Rp 0 dan ringkasan di halaman lembur ikut nol.
        amount:
          status === 'APPROVED'
            ? hitungUpahLembur(
                upahLemburPer.get(e.id) ?? e.gaji,
                isHoliday ? 0 : hours,
                isHoliday ? hours : 0,
                konfigLembur.get(e.id) ?? OVERTIME_DEFAULT,
              ).amount
            : 0,
      });
    }
  }
  await prisma.overtime.createMany({ data: overtimeRows });

  // Pastikan antrean persetujuan lembur selalu terisi pada data demo.
  // Tanpa ini, bulan berjalan yang baru berumur beberapa hari sering tidak
  // menghasilkan satu pun pengajuan menunggu, sehingga halamannya terlihat
  // kosong dan fiturnya tidak terlihat sama sekali.
  // Tanggalnya harus tanggal kalender, bukan waktu sekarang: new Date()
  // membawa jam saat seed dijalankan, sehingga barisnya tidak seragam dengan
  // tanggal lain dan bisa bergeser sehari saat dibaca di zona berbeda.
  for (let n = 0; n < 5; n++) {
    const e = employees[between(0, employees.length - 1)];
    const d = tambahHari(hariIniKalender(), -between(1, 9));
    if (d < e.joinDate) continue;
    const sudahAda = await prisma.overtime.findFirst({ where: { employeeId: e.id, date: d } });
    if (sudahAda) continue;
    await prisma.overtime.create({
      data: {
        employeeId: e.id,
        date: d,
        hours: between(2, 8) / 2 + 1,
        isHoliday: akhirPekan(d),
        reason: pick([
          'Menyelesaikan rilis fitur ke produksi',
          'Perbaikan insiden produksi malam hari',
          'Menutup laporan keuangan bulanan',
          'Menyiapkan data untuk audit internal',
          'Migrasi basis data akhir pekan',
        ]),
        status: 'PENDING',
      },
    });
  }

  console.log('› Pengajuan cuti…');
  const leaveRows: any[] = [];
  for (let back = 3; back >= 0; back--) {
    const [y, m] = periodeMundur(back).split('-').map(Number);
    for (let n = 0; n < 7; n++) {
      const e = employees[between(0, employees.length - 1)];
      const mulai = between(1, 20);
      const durasi = between(1, 4);
      const start = dariYMD(y, m, mulai);
      if (start < e.joinDate) continue;
      const status = back === 0 && rnd() < 0.5 ? 'PENDING' : rnd() < 0.85 ? 'APPROVED' : 'REJECTED';
      leaveRows.push({
        employeeId: e.id,
        type: pick(['ANNUAL', 'ANNUAL', 'ANNUAL', 'SICK', 'SICK', 'UNPAID', 'SPECIAL']),
        startDate: start,
        endDate: dariYMD(y, m, mulai + durasi - 1),
        days: durasi,
        reason: pick([
          'Acara keluarga di kampung halaman',
          'Pemulihan setelah sakit',
          'Mengurus dokumen kependudukan',
          'Liburan bersama keluarga',
          'Menghadiri pernikahan saudara',
          'Kontrol kesehatan rutin',
        ]),
        status,
        reviewedAt: status === 'PENDING' ? null : new Date(y, m - 1, Math.max(1, mulai - 2)),
        reviewNote: status === 'REJECTED' ? 'Bentrok dengan jadwal rilis, mohon ajukan ulang.' : null,
      });
    }
  }
  await prisma.leaveRequest.createMany({ data: leaveRows });

  console.log('› Menjalankan payroll 3 periode terakhir…');
  const bpjsConfig = {
    kesEmployeeRate: company.bpjsKesEmployeeRate,
    kesEmployerRate: company.bpjsKesEmployerRate,
    kesCap: company.bpjsKesCap,
    jhtEmployeeRate: company.bpjsJhtEmployeeRate,
    jhtEmployerRate: company.bpjsJhtEmployerRate,
    jpEmployeeRate: company.bpjsJpEmployeeRate,
    jpEmployerRate: company.bpjsJpEmployerRate,
    jpCap: company.bpjsJpCap,
    jkkRate: company.bpjsJkkRate,
    jkmRate: company.bpjsJkmRate,
  };

  for (let back = 3; back >= 1; back--) {
    const period = periodeMundur(back);
    const [y, m] = period.split('-').map(Number);
    const run = await prisma.payrollRun.create({
      data: {
        period,
        label: `Gaji ${period}`,
        status: 'PAID',
        payDate: dariYMD(y, m, company.payDay),
        calculatedAt: dariYMD(y, m, company.cutoffDay),
        approvedAt: dariYMD(y, m, company.cutoffDay + 2),
        approvedBy: 'Zainul Arkaan',
        paidAt: dariYMD(y, m, company.payDay),
      },
    });

    let tg = 0, td = 0, tt = 0, tn = 0, tec = 0, hc = 0;
    const workingDays = workingDaysInPeriod(period);

    for (const e of employees) {
      if (e.joinDate > dariYMD(y, m, 28)) continue;

      const assignments = await prisma.employeeComponent.findMany({
        where: { employeeId: e.id },
        include: { component: true },
      });

      const att = await prisma.attendance.groupBy({
        by: ['status'],
        where: { employeeId: e.id, date: { gte: dariYMD(y, m, 1), lt: dariYMD(y, m + 1, 1) } },
        _count: true,
      });
      const cnt = (s: string) => att.find((a) => a.status === s)?._count ?? 0;
      const lateAgg = await prisma.attendance.aggregate({
        where: { employeeId: e.id, date: { gte: dariYMD(y, m, 1), lt: dariYMD(y, m + 1, 1) } },
        _sum: { lateMinutes: true },
      });

      const otAgg = await prisma.overtime.findMany({
        where: {
          employeeId: e.id,
          status: 'APPROVED',
          date: { gte: dariYMD(y, m, 1), lt: dariYMD(y, m + 1, 1) },
        },
      });
      const otWeekday = otAgg.filter((o) => !o.isHoliday).reduce((s, o) => s + o.hours, 0);
      const otHoliday = otAgg.filter((o) => o.isHoliday).reduce((s, o) => s + o.hours, 0);
      // Nilai yang sudah dikunci saat persetujuan, sama seperti yang
      // diteruskan calculateRun — supaya slip hasil seed juga cocok dengan
      // angka yang tercatat pada pengajuan lemburnya.
      const otLocked = otAgg.reduce((s, o) => s + o.amount, 0);

      const loan = await prisma.loan.findFirst({
        where: { employeeId: e.id, status: 'ACTIVE' },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });

      const hadir = cnt('PRESENT') + cnt('LATE') + cnt('WFH');
      const masaKerjaBulan = Math.max(
        0,
        (y - e.joinDate.getFullYear()) * 12 + (m - 1 - e.joinDate.getMonth()),
      );
      // angka setelah garis miring pada status PTKP = jumlah tanggungan
      const tanggungan = Number(e.ptkp.split('/')[1] ?? 0);

      // Rumus diselesaikan lewat resolver bersama, sama persis dengan yang
      // dipakai proses gaji sungguhan — bukan salinan logika terpisah.
      const { lines } = resolveAll(assignments, {
        departmentId: null,
        level: null,
        baseSalary: e.gaji,
        variables: buildVariables({
          baseSalary: e.gaji,
          fixedAllowance: 0,
          workingDays,
          presentDays: hadir,
          absentDays: cnt('ABSENT'),
          leaveDays: cnt('LEAVE'),
          overtimeHours: otWeekday,
          overtimeHolidayHours: otHoliday,
          lateMinutes: lateAgg._sum.lateMinutes ?? 0,
          monthsOfService: masaKerjaBulan,
          dependents: tanggungan,
          paidDays: workingDays,
        }),
      });

      const hasil = calculatePayroll({
        employeeId: e.id,
        fullName: '',
        baseSalary: e.gaji,
        ptkpStatus: e.ptkp,
        hasNpwp: true,
        enrollBpjsKes: true,
        enrollBpjsTk: true,
        components: lines,
        overtimeHours: otWeekday,
        overtimeHolidayHours: otHoliday,
        overtimeLocked: otLocked,
        presentDays: cnt('PRESENT') + cnt('LATE') + cnt('WFH'),
        absentDays: cnt('ABSENT'),
        leaveDays: cnt('LEAVE'),
        unpaidLeaveDays: 0,
        lateMinutes: lateAgg._sum.lateMinutes ?? 0,
        loanDeduction: loan?.monthlyDeduction ?? 0,
        workingDays,
        cutAbsent: company.absentCutPerDay,
        bpjs: bpjsConfig,
      });

      await prisma.payrollItem.create({
        data: {
          runId: run.id,
          employeeId: e.id,
          baseSalary: hasil.baseSalary,
          allowanceTaxable: hasil.allowanceTaxable,
          allowanceNonTax: hasil.allowanceNonTax,
          overtimePay: hasil.overtimePay,
          grossPay: hasil.grossPay,
          bpjsKesEmployee: hasil.bpjsKesEmployee,
          bpjsJhtEmployee: hasil.bpjsJhtEmployee,
          bpjsJpEmployee: hasil.bpjsJpEmployee,
          bpjsKesEmployer: hasil.bpjsKesEmployer,
          bpjsJhtEmployer: hasil.bpjsJhtEmployer,
          bpjsJpEmployer: hasil.bpjsJpEmployer,
          bpjsJkkEmployer: hasil.bpjsJkkEmployer,
          bpjsJkmEmployer: hasil.bpjsJkmEmployer,
          otherDeduction: hasil.otherDeduction,
          loanDeduction: hasil.loanDeduction,
          unpaidLeaveCut: hasil.unpaidLeaveCut,
          lateCut: hasil.lateCut,
          taxableIncome: hasil.taxableIncome,
          taxAllowance: hasil.taxAllowance,
          prorateDays: hasil.prorateDays,
          terRate: hasil.terRate,
          pph21: hasil.pph21,
          taxMethod: hasil.taxMethod,
          totalDeduction: hasil.totalDeduction,
          netPay: hasil.netPay,
          employerCost: hasil.employerCost,
          presentDays: cnt('PRESENT') + cnt('LATE') + cnt('WFH'),
          absentDays: cnt('ABSENT'),
          leaveDays: cnt('LEAVE'),
          overtimeHours: otWeekday + otHoliday,
          breakdown: JSON.stringify(hasil.breakdown),
        },
      });

      tg += hasil.grossPay;
      td += hasil.totalDeduction;
      tt += hasil.pph21;
      tn += hasil.netPay;
      tec += hasil.employerCost;
      hc++;
    }

    await prisma.payrollRun.update({
      where: { id: run.id },
      data: {
        totalGross: tg,
        totalDeduction: td,
        totalTax: tt,
        totalNet: tn,
        totalEmployerCost: tec,
        headcount: hc,
      },
    });
    console.log(`  ${period}: ${hc} karyawan, net Rp ${tn.toLocaleString('id-ID')}`);
  }

  console.log('› Proses THR Idulfitri…');
  {
    // THR memakai fungsi yang sama dengan aksi di aplikasi, bukan salinan
    // logika, supaya angkanya tidak pernah berbeda.
    const periodeThr = periodeMundur(2);
    const [ty, tm] = periodeThr.split('-').map(Number);
    const tanggalBayar = new Date(ty, tm - 1, 13);

    const runThr = await prisma.payrollRun.create({
      data: {
        period: periodeThr + '-THR',
        label: 'THR Idulfitri 1447 H',
        kind: 'THR',
        holidayName: 'Idulfitri 1447 H',
        status: 'PAID',
        payDate: tanggalBayar,
        calculatedAt: tanggalBayar,
        approvedAt: tanggalBayar,
        approvedBy: 'Zainul Arkaan',
        paidAt: tanggalBayar,
      },
    });

    let tg = 0, tt = 0, tn = 0, hc = 0;
    for (const e of employees) {
      const assignments = await prisma.employeeComponent.findMany({
        where: { employeeId: e.id },
        include: { component: true },
      });
      const tunjanganTetap = assignments
        .filter((a) => a.component.active && a.component.type === 'ALLOWANCE' && a.component.calcType !== 'FORMULA')
        .reduce(
          (t, a) =>
            t +
            (a.overrideAmount ??
              (a.component.calcType === 'PERCENT_OF_BASE'
                ? Math.round((e.gaji * a.component.percent) / 100)
                : a.component.amount)),
          0,
        );

      const bulan = masaKerjaBulan(e.joinDate, tanggalBayar);
      const thr = hitungThr(e.gaji + tunjanganTetap, bulan);
      if (thr.amount === 0) continue;

      const brutoReguler = e.gaji + tunjanganTetap;
      const { pajak } = pajakThr(brutoReguler, thr.amount, (b) => pph21Ter(Math.max(0, b), e.ptkp, true).tax);
      const netPay = Math.max(0, thr.amount - pajak);

      await prisma.payrollItem.create({
        data: {
          runId: runThr.id,
          employeeId: e.id,
          baseSalary: 0,
          allowanceTaxable: thr.amount,
          grossPay: thr.amount,
          thrAmount: thr.amount,
          serviceMonths: bulan,
          taxableIncome: thr.amount,
          terRate: pph21Ter(Math.max(0, brutoReguler + thr.amount), e.ptkp, true).rate,
          pph21: pajak,
          taxMethod: 'TER',
          totalDeduction: pajak,
          netPay,
          employerCost: thr.amount,
          transferStatus: 'SENT',
          transferredAt: tanggalBayar,
          breakdown: JSON.stringify([
            {
              group: 'EARNING',
              label: 'Tunjangan Hari Raya',
              amount: thr.amount,
              note: `${thr.note} Dasar upah ${brutoReguler.toLocaleString('id-ID')}.`,
            },
            ...(pajak > 0
              ? [{ group: 'DEDUCTION', label: 'PPh 21 atas THR', amount: pajak, note: 'Metode selisih atas penghasilan tidak teratur.' }]
              : []),
          ]),
        },
      });

      tg += thr.amount;
      tt += pajak;
      tn += netPay;
      hc++;
    }

    await prisma.payrollRun.update({
      where: { id: runThr.id },
      data: { totalGross: tg, totalDeduction: tt, totalTax: tt, totalNet: tn, totalEmployerCost: tg, headcount: hc },
    });
    console.log(`  ${hc} karyawan · THR bersih Rp ${tn.toLocaleString('id-ID')}`);
  }

  console.log('› Jejak audit & notifikasi…');
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (admin) {
    await prisma.auditLog.createMany({
      data: [
        { userId: admin.id, actorName: admin.name, action: 'RUN', entity: 'PayrollRun', summary: `Payroll ${periodeMundur(1)} dibayarkan ke ${employees.length} karyawan` },
        { userId: admin.id, actorName: admin.name, action: 'APPROVE', entity: 'PayrollRun', summary: `Payroll ${periodeMundur(1)} disetujui` },
        { userId: admin.id, actorName: admin.name, action: 'UPDATE', entity: 'CompanySetting', summary: 'Plafon BPJS Jaminan Pensiun disesuaikan' },
        { userId: admin.id, actorName: admin.name, action: 'CREATE', entity: 'SalaryComponent', summary: 'Komponen Tunjangan Kerja Jarak Jauh ditambahkan' },
      ],
    });
    await prisma.notification.createMany({
      data: [
        { userId: admin.id, title: 'Payroll periode berjalan belum dihitung', body: `Periode ${periodeMundur(0)} masih kosong. Buat proses gaji sebelum tanggal cutoff.`, kind: 'warning', href: '/payroll' },
        { userId: admin.id, title: 'Ada pengajuan menunggu persetujuan', body: 'Beberapa pengajuan cuti dan lembur menunggu ditinjau.', kind: 'info', href: '/leave' },
        { userId: admin.id, title: 'Data karyawan lengkap', body: `${employees.length} karyawan aktif berhasil dimuat.`, kind: 'success', href: '/employees' },
      ],
    });
  }

  console.log('\n✓ Seed selesai.');
  console.log('  Admin    : admin@racik.id / password123');
  console.log('  HR       : larasati.widyaningrum@nusantaradigital.id / password123');
  console.log('  Karyawan : bagas.setiawan@nusantaradigital.id / password123');
}

/*
 * Hanya berjalan sendiri bila berkas ini dieksekusi langsung sebagai skrip.
 * Saat diimpor oleh rute, pemanggilnya yang menentukan kapan seed dijalankan.
 */
const dijalankanLangsung = (process.argv[1] ?? '').endsWith('seed.ts');

if (dijalankanLangsung) {
  jalankanSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
