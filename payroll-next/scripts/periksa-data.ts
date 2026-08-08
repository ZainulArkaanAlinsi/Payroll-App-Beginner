/**
 * Pemeriksa keutuhan data.
 *
 * Uji otomatis memastikan tiap fungsi benar bila diberi masukan tertentu.
 * Berkas ini menanyakan hal yang berbeda: apakah isi basis data yang ada
 * sekarang masih konsisten satu sama lain.
 *
 * Dua hal itu tidak saling menggantikan. Perhitungan bisa benar sementara
 * datanya terlanjur rusak karena proses yang gagal separuh jalan, penyuntingan
 * manual, atau perubahan kode yang lama. Kesalahan semacam itu tidak
 * menimbulkan galat apa pun — angkanya hanya tidak lagi cocok, dan baru
 * ketahuan saat ada yang menghitung ulang dengan tangan.
 *
 *   npm run periksa
 */

import { PrismaClient } from '@prisma/client';
import { periksaKepatuhan } from '../src/lib/kepatuhan';
import { periksaTransfer } from '../src/lib/transfer';

const prisma = new PrismaClient();
const rupiah = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

interface Temuan {
  bagian: string;
  pesan: string;
  berat: 'GAGAL' | 'AWAS';
}

const temuan: Temuan[] = [];
let diperiksa = 0;

function periksa(bagian: string, lulus: boolean, pesan: string, berat: 'GAGAL' | 'AWAS' = 'GAGAL') {
  diperiksa++;
  if (!lulus) temuan.push({ bagian, pesan, berat });
}

function judul(t: string) {
  console.log(`\n${t}`);
}

function baris(label: string, isi: string) {
  console.log(`  ${label.padEnd(38)} ${isi}`);
}

async function main() {
  console.log('Pemeriksaan keutuhan data Racik');
  console.log('═'.repeat(60));

  // ── 1. Slip gaji ──────────────────────────────────────────────────
  judul('1. Slip gaji');
  const items = await prisma.payrollItem.findMany({
    include: { run: { select: { period: true, kind: true, status: true } }, employee: { select: { fullName: true } } },
  });
  baris('slip diperiksa', String(items.length));

  for (const it of items) {
    const nama = `${it.employee.fullName} (${it.run.period})`;

    // Bruto dikurangi potongan harus sama dengan yang diterima. Bila tidak,
    // slip yang dibaca karyawan tidak menjelaskan angka di rekeningnya.
    periksa('slip', it.grossPay - it.totalDeduction === it.netPay,
      `${nama}: bruto ${rupiah(it.grossPay)} − potongan ${rupiah(it.totalDeduction)} ≠ diterima ${rupiah(it.netPay)}`);

    periksa('slip', it.netPay >= 0, `${nama}: gaji diterima negatif ${rupiah(it.netPay)}`);
    periksa('slip', it.pph21 >= 0, `${nama}: PPh 21 negatif`);

    // Rincian yang tampil di slip harus menjumlah ke totalnya. Kalau tidak,
    // karyawan menjumlahkan sendiri dan hasilnya beda.
    if (it.breakdown) {
      let rows: { group: string; label: string; amount: number }[] = [];
      try {
        rows = JSON.parse(it.breakdown);
      } catch {
        periksa('slip', false, `${nama}: rincian bukan JSON yang sah`);
        continue;
      }
      // Seluruh nilai disimpan positif; yang membedakan pendapatan dari
      // potongan adalah kolom `group`.
      const masuk = rows.filter((r) => r.group === 'EARNING').reduce((a, r) => a + r.amount, 0);
      const keluar = rows.filter((r) => r.group === 'DEDUCTION').reduce((a, r) => a + r.amount, 0);

      periksa('slip', rows.every((r) => r.amount >= 0),
        `${nama}: ada baris rincian bernilai negatif — tandanya harus ditentukan oleh group`);
      periksa('slip', masuk === it.grossPay,
        `${nama}: jumlah rincian pendapatan ${rupiah(masuk)} ≠ bruto ${rupiah(it.grossPay)}`);
      periksa('slip', keluar === it.totalDeduction,
        `${nama}: jumlah rincian potongan ${rupiah(keluar)} ≠ total potongan ${rupiah(it.totalDeduction)}`);
    }
  }

  // ── 2. Total periode ──────────────────────────────────────────────
  judul('2. Total periode terhadap slip di dalamnya');
  const runs = await prisma.payrollRun.findMany({ include: { items: true } });
  for (const r of runs) {
    if (r.status === 'DRAFT') continue;
    const g = r.items.reduce((a, i) => a + i.grossPay, 0);
    const n = r.items.reduce((a, i) => a + i.netPay, 0);
    const p = r.items.reduce((a, i) => a + i.pph21, 0);

    periksa('periode', r.totalGross === g, `${r.period}: total bruto tercatat ${rupiah(r.totalGross)} ≠ jumlah slip ${rupiah(g)}`);
    periksa('periode', r.totalNet === n, `${r.period}: total bersih tercatat ${rupiah(r.totalNet)} ≠ jumlah slip ${rupiah(n)}`);
    periksa('periode', r.totalTax === p, `${r.period}: total pajak tercatat ${rupiah(r.totalTax)} ≠ jumlah slip ${rupiah(p)}`);
    periksa('periode', r.headcount === r.items.length, `${r.period}: headcount ${r.headcount} ≠ jumlah slip ${r.items.length}`);

    baris(`${r.period} (${r.kind}, ${r.status})`, `${r.items.length} slip · bersih ${rupiah(r.totalNet)}`);
  }

  // ── 3. Konvensi tanggal ───────────────────────────────────────────
  judul('3. Tanggal kalender seragam');
  const tengahMalam = (d: Date) => d.toISOString().endsWith('T00:00:00.000Z');
  const [hadir, cuti, lembur] = await Promise.all([
    prisma.attendance.findMany({ select: { date: true } }),
    prisma.leaveRequest.findMany({ select: { startDate: true, endDate: true } }),
    prisma.overtime.findMany({ select: { date: true } }),
  ]);

  const salahTanggal = [
    ...hadir.filter((a) => !tengahMalam(a.date)).map(() => 'kehadiran'),
    ...cuti.filter((c) => !tengahMalam(c.startDate) || !tengahMalam(c.endDate)).map(() => 'cuti'),
    ...lembur.filter((o) => !tengahMalam(o.date)).map(() => 'lembur'),
  ];
  periksa('tanggal', salahTanggal.length === 0,
    `${salahTanggal.length} tanggal kalender bukan tengah malam UTC — akan bergeser sehari di zona lain`);
  baris('tanggal kalender diperiksa', String(hadir.length + cuti.length * 2 + lembur.length));

  // ── 4. Kehadiran terhadap slip ────────────────────────────────────
  judul('4. Kehadiran terhadap slip');
  let cocokHadir = 0;
  let bedaHadir = 0;
  for (const it of items) {
    if (it.run.kind === 'THR') continue; // THR tidak bergantung kehadiran
    const [y, m] = it.run.period.split('-').map(Number);
    if (!y || !m) continue;
    const awal = new Date(Date.UTC(y, m - 1, 1));
    const akhir = new Date(Date.UTC(y, m, 1));
    const n = await prisma.attendance.count({
      where: { employeeId: it.employeeId, date: { gte: awal, lt: akhir }, status: { in: ['PRESENT', 'LATE', 'WFH'] } },
    });
    if (n === it.presentDays) cocokHadir++;
    else {
      bedaHadir++;
      periksa('kehadiran', false,
        `${it.employee.fullName} ${it.run.period}: slip mencatat ${it.presentDays} hari hadir, tabel kehadiran ${n}`,
        'AWAS');
    }
  }
  baris('slip yang hari hadirnya cocok', `${cocokHadir} cocok · ${bedaHadir} berbeda`);

  // ── 5. Lembur disetujui terhadap slip ─────────────────────────────
  judul('5. Lembur disetujui terhadap slip');
  let cocokLembur = 0;
  for (const it of items) {
    if (it.run.kind === 'THR') continue;
    const [y, m] = it.run.period.split('-').map(Number);
    if (!y || !m) continue;
    const agg = await prisma.overtime.aggregate({
      where: {
        employeeId: it.employeeId, status: 'APPROVED',
        date: { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) },
      },
      _sum: { amount: true, hours: true },
    });
    const nilai = agg._sum.amount ?? 0;
    if (nilai === it.overtimePay) cocokLembur++;
    else periksa('lembur', false,
      `${it.employee.fullName} ${it.run.period}: slip ${rupiah(it.overtimePay)}, lembur disetujui ${rupiah(nilai)}`);
  }
  baris('slip yang lemburnya cocok', String(cocokLembur));

  // ── 6. Siap transfer ──────────────────────────────────────────────
  judul('6. Kesiapan transfer periode terbayar');
  const terbayar = runs.filter((r) => r.status === 'PAID' && r.kind !== 'THR');
  for (const r of terbayar.slice(-1)) {
    const rincian = await prisma.payrollItem.findMany({
      where: { runId: r.id },
      include: { employee: { select: { fullName: true, bankName: true, bankAccount: true, bankHolder: true } } },
    });
    const hasil = periksaTransfer(
      rincian.map((i) => ({
        employeeId: i.employeeId,
        nama: i.employee.fullName,
        bankName: i.employee.bankName,
        bankAccount: i.employee.bankAccount,
        bankHolder: i.employee.bankHolder,
        netPay: i.netPay,
      })),
    );
    const penghalang = hasil.filter((h) => h.tingkat === 'PENGHALANG');
    const peringatan = hasil.filter((h) => h.tingkat === 'PERINGATAN');
    baris(`${r.period}`, `${penghalang.length} penghalang · ${peringatan.length} peringatan`);
    periksa('transfer', penghalang.length === 0,
      `${r.period}: ${penghalang.map((p) => `${p.pesan} (${p.terdampak.length} orang)`).join('; ')}`);
    for (const p of peringatan) baris('  peringatan', `${p.pesan} — ${p.terdampak.length} orang`);
  }

  // ── 7. Kepatuhan ──────────────────────────────────────────────────
  judul('7. Kepatuhan ketenagakerjaan');
  const karyawan = await prisma.employee.findMany({
    include: { components: { include: { component: true } } },
  });
  const setting = await prisma.companySetting.findUnique({ where: { id: 'singleton' } });
  const kep = periksaKepatuhan(
    karyawan.map((e) => ({
      id: e.id,
      nama: e.fullName,
      status: e.status,
      gajiPokok: e.baseSalary,
      // Hanya tunjangan tetap yang dihitung. Komponen berumus nilainya
      // bergantung kehadiran, jadi bukan tunjangan tetap menurut PP 36/2021.
      tunjanganTetap: e.components
        .filter((c) => c.component.type === 'EARNING' && c.component.calcType === 'FIXED')
        .reduce((a, c) => a + (c.overrideAmount ?? c.component.amount), 0),
    })),
    {
      upahMinimum: setting?.minimumWage ?? 0,
      wilayah: setting?.minimumWageRegion ?? '—',
      periksaRasioPokok: true,
    },
  );
  const pelanggaran = kep.filter((k) => k.tingkat === 'PELANGGARAN');
  baris('temuan kepatuhan', `${pelanggaran.length} pelanggaran · ${kep.length - pelanggaran.length} peringatan`);
  for (const p of kep) baris('  ·', `${p.judul} — ${p.terdampak.length} orang (${p.dasar})`);

  // ── 8. Keterkaitan akun ───────────────────────────────────────────
  judul('8. Keterkaitan akun dan karyawan');
  const users = await prisma.user.findMany({ include: { employee: { select: { id: true, email: true } } } });
  const karyawanTanpaAkun = await prisma.employee.count({ where: { userId: null, status: 'ACTIVE' } });

  for (const u of users) {
    if (u.role !== 'EMPLOYEE') continue;
    periksa('akun', u.employee !== null, `akun ${u.email} berperan EMPLOYEE tetapi tidak tertaut data karyawan`);
    if (u.employee) {
      periksa('akun', u.employee.email === u.email,
        `akun ${u.email} tertaut karyawan bersurel berbeda (${u.employee.email})`, 'AWAS');
    }
  }
  baris('akun diperiksa', `${users.length} akun · ${karyawanTanpaAkun} karyawan aktif tanpa akun`);

  // ── 9. Rekening ───────────────────────────────────────────────────
  judul('9. Rekening gaji');
  const aktif = await prisma.employee.findMany({
    where: { status: 'ACTIVE' },
    select: { fullName: true, bankAccount: true },
  });
  const kosong = aktif.filter((e) => !e.bankAccount?.trim());
  const hitung = new Map<string, number>();
  for (const e of aktif) {
    if (e.bankAccount?.trim()) hitung.set(e.bankAccount.trim(), (hitung.get(e.bankAccount.trim()) ?? 0) + 1);
  }
  const kembar = [...hitung.entries()].filter(([, n]) => n > 1);

  periksa('rekening', kosong.length === 0, `${kosong.length} karyawan aktif tanpa rekening: ${kosong.slice(0, 3).map((e) => e.fullName).join(', ')}`);
  periksa('rekening', kembar.length === 0, `${kembar.length} nomor rekening dipakai lebih dari satu karyawan`);
  baris('rekening karyawan aktif', `${aktif.length - kosong.length}/${aktif.length} terisi · ${kembar.length} kembar`);

  // ── hasil ─────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  const gagal = temuan.filter((t) => t.berat === 'GAGAL');
  const awas = temuan.filter((t) => t.berat === 'AWAS');

  if (temuan.length === 0) {
    console.log(`✓ ${diperiksa} pemeriksaan, semuanya lolos.`);
  } else {
    if (gagal.length) {
      console.log(`\n✗ ${gagal.length} MASALAH dari ${diperiksa} pemeriksaan:\n`);
      for (const t of gagal.slice(0, 25)) console.log(`  [${t.bagian}] ${t.pesan}`);
      if (gagal.length > 25) console.log(`  … dan ${gagal.length - 25} lagi`);
    }
    if (awas.length) {
      console.log(`\n! ${awas.length} peringatan:\n`);
      for (const t of awas.slice(0, 10)) console.log(`  [${t.bagian}] ${t.pesan}`);
      if (awas.length > 10) console.log(`  … dan ${awas.length - 10} lagi`);
    }
  }

  await prisma.$disconnect();
  process.exit(gagal.length ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
