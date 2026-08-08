import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma';
import {
  absen, absensiHariIni, ajukanCuti, ajukanLembur, hariKerja, nilaiLembur,
  sisaKuotaCuti, upahLemburKaryawan,
} from '../src/lib/self-service';
import { calculatePayroll } from '../src/lib/payroll-engine';
import { hariIni, kalender, pukul } from '../src/lib/waktu';
import { BPJS_UJI, aktorHr, aktorKaryawan, siapkan, tutup, type Bekal } from './helpers/bekal';

/**
 * Aturan layanan mandiri dipakai dua muka sekaligus: server action milik web
 * dan rute JSON milik aplikasi ponsel. Yang diuji di sini bukan salah satunya,
 * melainkan aturannya sendiri — sehingga tidak mungkin ada muka yang lolos
 * dari pemeriksaan yang ditegakkan pada muka lainnya.
 */

let b: Bekal;

before(async () => {
  b = await siapkan();
});

after(tutup);

describe('Hari kerja dihitung tanpa akhir pekan', () => {
  test('Senin sampai Jumat sama dengan lima hari', () => {
    assert.equal(hariKerja(kalender('2026-11-02'), kalender('2026-11-06')), 5);
  });

  test('rentang yang melewati akhir pekan tidak menghitungnya', () => {
    // Sen 2 Nov – Sen 9 Nov: enam hari kerja, dua hari akhir pekan dilewati.
    assert.equal(hariKerja(kalender('2026-11-02'), kalender('2026-11-09')), 6);
  });

  test('sehari akhir pekan tetap dihitung satu, bukan nol', () => {
    // Cuti sehari pada hari Sabtu janggal, tetapi mencatatnya nol hari membuat
    // pengajuannya seolah tidak ada sama sekali.
    assert.equal(hariKerja(kalender('2026-11-07'), kalender('2026-11-07')), 1);
  });
});

describe('Pengajuan cuti', () => {
  test('kuota awal menyisakan sepuluh dari dua belas hari', async () => {
    const k = await sisaKuotaCuti(b.aditId);
    assert.deepEqual(k, { kuota: 12, terpakai: 2, sisa: 10 });
  });

  test('pengajuan wajar diterima', async () => {
    const h = await ajukanCuti(aktorKaryawan(b), {
      employeeId: b.aditId,
      type: 'ANNUAL',
      startDate: '2026-11-02',
      endDate: '2026-11-04',
      reason: 'Keperluan keluarga di luar kota',
    });
    assert.equal(h.ok, true, h.error);
    assert.match(h.message ?? '', /3 hari/);
  });

  test('tanggal yang beririsan ditolak', async () => {
    const h = await ajukanCuti(aktorKaryawan(b), {
      employeeId: b.aditId,
      type: 'SICK',
      startDate: '2026-11-03',
      endDate: '2026-11-05',
      reason: 'Beririsan dengan pengajuan sebelumnya',
    });
    assert.equal(h.ok, false);
    assert.match(h.error ?? '', /Sudah ada pengajuan/);
  });

  test('tanggal bersebelahan tanpa irisan diterima', async () => {
    // Batasnya harus tepat: 5 Nov bersebelahan dengan 2–4 Nov, tidak beririsan.
    const h = await ajukanCuti(aktorKaryawan(b), {
      employeeId: b.aditId,
      type: 'SICK',
      startDate: '2026-11-05',
      endDate: '2026-11-05',
      reason: 'Bersebelahan tetapi tidak beririsan',
    });
    assert.equal(h.ok, true, h.error);
  });

  test('melebihi sisa kuota ditolak dengan menyebut sisanya', async () => {
    const h = await ajukanCuti(aktorKaryawan(b), {
      employeeId: b.aditId,
      type: 'ANNUAL',
      startDate: '2026-12-01',
      endDate: '2026-12-31',
      reason: 'Melebihi kuota yang tersisa',
    });
    assert.equal(h.ok, false);
    assert.match(h.error ?? '', /tinggal 10 hari/);
  });

  test('cuti sakit tidak dibatasi kuota tahunan', async () => {
    // Kuota tahunan hanya berlaku untuk cuti tahunan; sakit panjang tidak
    // boleh tertolak karena kuota liburan sudah habis.
    const h = await ajukanCuti(aktorKaryawan(b), {
      employeeId: b.aditId,
      type: 'SICK',
      startDate: '2027-01-04',
      endDate: '2027-02-05',
      reason: 'Pemulihan setelah operasi',
    });
    assert.equal(h.ok, true, h.error);
  });

  test('tanggal selesai sebelum mulai ditolak', async () => {
    const h = await ajukanCuti(aktorKaryawan(b), {
      employeeId: b.aditId, type: 'ANNUAL',
      startDate: '2027-05-10', endDate: '2027-05-03',
      reason: 'Urutan tanggal terbalik',
    });
    assert.equal(h.ok, false);
    assert.match(h.error ?? '', /tidak boleh sebelum/);
  });

  test('alasan terlalu pendek ditolak', async () => {
    const h = await ajukanCuti(aktorKaryawan(b), {
      employeeId: b.aditId, type: 'ANNUAL',
      startDate: '2027-06-01', endDate: '2027-06-01', reason: 'a',
    });
    assert.equal(h.ok, false);
    assert.match(h.error ?? '', /minimal 6 karakter/);
  });

  test('tanggal tidak terbaca ditolak, bukan disimpan sebagai tanggal ngawur', async () => {
    const h = await ajukanCuti(aktorKaryawan(b), {
      employeeId: b.aditId, type: 'ANNUAL',
      startDate: 'kemarin', endDate: 'besok', reason: 'Tanggal tidak sah',
    });
    assert.equal(h.ok, false);
    assert.match(h.error ?? '', /tidak terbaca/);
  });

  test('karyawan tidak bisa mengajukan atas nama orang lain', async () => {
    const h = await ajukanCuti(aktorKaryawan(b), {
      employeeId: b.binaId, // milik orang lain
      type: 'ANNUAL', startDate: '2027-07-01', endDate: '2027-07-02',
      reason: 'Mengajukan untuk rekan kerja',
    });
    assert.equal(h.ok, false);
    assert.match(h.error ?? '', /diri sendiri/);

    const jumlah = await prisma.leaveRequest.count({ where: { employeeId: b.binaId } });
    assert.equal(jumlah, 0, 'tidak boleh ada yang tersimpan');
  });

  test('HR boleh mengajukan untuk karyawan lain', async () => {
    const h = await ajukanCuti(aktorHr(), {
      employeeId: b.binaId,
      type: 'ANNUAL', startDate: '2027-07-01', endDate: '2027-07-02',
      reason: 'Diinput HR atas permintaan karyawan',
    });
    assert.equal(h.ok, true, h.error);
  });

  test('pengelola menerima pemberitahuan atas pengajuan baru', async () => {
    const n = await prisma.notification.count({ where: { title: 'Pengajuan cuti baru' } });
    assert.ok(n > 0, 'pengajuan yang tidak diberitahukan tidak akan pernah ditinjau');
  });
});

describe('Pengajuan lembur', () => {
  test('pengajuan wajar diterima dan hari kerja bukan hari libur', async () => {
    const h = await ajukanLembur(aktorKaryawan(b), {
      employeeId: b.aditId, date: '2026-11-10', hours: 3,
      reason: 'Menyelesaikan rilis sistem',
    });
    assert.equal(h.ok, true, h.error);

    const ot = await prisma.overtime.findFirst({ where: { employeeId: b.aditId, date: kalender('2026-11-10') } });
    assert.equal(ot?.isHoliday, false, '10 Nov 2026 hari Selasa');
  });

  test('akhir pekan ditandai hari libur', async () => {
    await ajukanLembur(aktorKaryawan(b), {
      employeeId: b.aditId, date: '2026-11-14', hours: 4,
      reason: 'Pemeliharaan server akhir pekan',
    });
    const ot = await prisma.overtime.findFirst({ where: { employeeId: b.aditId, date: kalender('2026-11-14') } });
    assert.equal(ot?.isHoliday, true, '14 Nov 2026 hari Sabtu');
  });

  test('tanggal yang sama tidak bisa diajukan dua kali', async () => {
    const h = await ajukanLembur(aktorKaryawan(b), {
      employeeId: b.aditId, date: '2026-11-10', hours: 2,
      reason: 'Pengajuan kedua di tanggal sama',
    });
    assert.equal(h.ok, false);
    assert.match(h.error ?? '', /Sudah ada pengajuan lembur/);
  });

  test('jam nol atau negatif ditolak', async () => {
    for (const jam of [0, -3]) {
      const h = await ajukanLembur(aktorKaryawan(b), {
        employeeId: b.aditId, date: '2026-11-17', hours: jam,
        reason: 'Jumlah jam tidak masuk akal',
      });
      assert.equal(h.ok, false, `jam ${jam} seharusnya ditolak`);
    }
  });

  test('lebih dari dua belas jam sehari ditolak', async () => {
    const h = await ajukanLembur(aktorKaryawan(b), {
      employeeId: b.aditId, date: '2026-11-17', hours: 20,
      reason: 'Dua puluh jam dalam sehari',
    });
    assert.equal(h.ok, false);
    assert.match(h.error ?? '', /tidak wajar/);
  });

  test('karyawan tidak bisa mengajukan lembur atas nama orang lain', async () => {
    const h = await ajukanLembur(aktorKaryawan(b), {
      employeeId: b.binaId, date: '2026-11-18', hours: 2,
      reason: 'Mengajukan untuk rekan kerja',
    });
    assert.equal(h.ok, false);
    assert.match(h.error ?? '', /diri sendiri/);
  });
});

describe('Absen masuk dan pulang', () => {
  test('belum ada catatan sebelum absen', async () => {
    const k = await absensiHariIni(b.aditId);
    assert.deepEqual(
      { masuk: k.sudahMasuk, pulang: k.sudahPulang },
      { masuk: false, pulang: false },
    );
  });

  test('absen pulang sebelum masuk ditolak', async () => {
    const h = await absen(aktorKaryawan(b), 'OUT');
    assert.equal(h.ok, false);
    assert.match(h.error ?? '', /belum absen masuk/);
  });

  test('absen masuk tercatat pada tanggal kalender hari ini', async () => {
    const h = await absen(aktorKaryawan(b), 'IN');
    assert.equal(h.ok, true, h.error);

    const a = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: b.aditId, date: hariIni() } },
    });
    assert.ok(a, 'catatan harus tersimpan pada tanggal kalender, bukan tanggal server');
    assert.ok(a.clockIn);
  });

  test('absen masuk dua kali ditolak', async () => {
    const h = await absen(aktorKaryawan(b), 'IN');
    assert.equal(h.ok, false);
    assert.match(h.error ?? '', /sudah absen masuk/);
  });

  test('absen pulang mencatat lama kerja', async () => {
    const h = await absen(aktorKaryawan(b), 'OUT');
    assert.equal(h.ok, true, h.error);

    const k = await absensiHariIni(b.aditId);
    assert.equal(k.sudahPulang, true);
    assert.ok(k.workMinutes >= 0);
  });

  test('absen pulang dua kali ditolak', async () => {
    const h = await absen(aktorKaryawan(b), 'OUT');
    assert.equal(h.ok, false);
    assert.match(h.error ?? '', /sudah absen pulang/);
  });

  test('akun tanpa data karyawan ditolak', async () => {
    const h = await absen(aktorHr(), 'IN');
    assert.equal(h.ok, false);
    assert.match(h.error ?? '', /tidak tertaut/);
  });

  test('status terlambat mengikuti jam perusahaan, bukan jam server', async () => {
    // Jam masuk 09.00 dengan toleransi 15 menit. Batasnya 09.15 WIB, yang
    // dalam UTC adalah 02.15 — bukan 09.15. Di server UTC, penafsiran yang
    // keliru membuat batasnya jatuh pukul 16.15 WIB dan tidak ada seorang pun
    // yang pernah tercatat terlambat.
    const batas = pukul(hariIni(), 9, 15);
    assert.equal(batas.toISOString().slice(11, 16), '02:15');

    const a = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: b.aditId, date: hariIni() } },
    });
    const telatSeharusnya = a!.clockIn! > batas;
    assert.equal(
      a!.status,
      telatSeharusnya ? 'LATE' : 'PRESENT',
      'status harus sesuai dengan perbandingan terhadap batas WIB',
    );
    if (!telatSeharusnya) assert.equal(a!.lateMinutes, 0);
  });
});

describe('Nilai lembur: yang disetujui sama dengan yang dibayarkan', () => {
  /**
   * Dulu ada tiga jalur yang menghitung lembur sendiri-sendiri: mesin gaji
   * memakai gaji pokok ditambah tunjangan tetap, sedangkan persetujuan dan
   * pratinjau hanya memakai gaji pokok. Akibatnya HR menyebut satu angka saat
   * menyetujui, lalu slip membayar angka lain — selisihnya belasan persen dan
   * tidak menimbulkan galat apa pun.
   */

  const TUNJANGAN = 2_000_000;

  before(async () => {
    const komponen = await prisma.salaryComponent.create({
      data: {
        code: 'TJ-UJI', name: 'Tunjangan Jabatan', type: 'EARNING',
        calcType: 'FIXED', amount: TUNJANGAN, taxable: true,
      },
    });
    await prisma.employeeComponent.create({
      data: { employeeId: b.aditId, componentId: komponen.id },
    });
  });

  test('dasar upah lembur ikut menghitung tunjangan tetap', async () => {
    const upah = await upahLemburKaryawan(b.aditId);
    assert.equal(upah, 10_000_000 + TUNJANGAN, 'gaji pokok saja tidak cukup');
  });

  test('tunjangan berumus tidak ikut, karena belum diketahui saat disetujui', async () => {
    const rumus = await prisma.salaryComponent.create({
      data: {
        code: 'TJ-RUMUS', name: 'Tunjangan Kehadiran', type: 'EARNING',
        calcType: 'FORMULA', formula: 'HARI_HADIR * 50000', taxable: true,
      },
    });
    await prisma.employeeComponent.create({
      data: { employeeId: b.aditId, componentId: rumus.id },
    });

    const upah = await upahLemburKaryawan(b.aditId);
    assert.equal(upah, 10_000_000 + TUNJANGAN, 'komponen berumus tidak boleh ikut');

    await prisma.employeeComponent.deleteMany({ where: { componentId: rumus.id } });
    await prisma.salaryComponent.delete({ where: { id: rumus.id } });
  });

  test('kenaikan gaji setelah persetujuan tidak mengubah lembur yang lampau', async () => {
    // Menyamakan nilai terkunci dengan hasil hitung ulang tidak membuktikan
    // apa pun — keduanya memang sama selama gajinya tidak berubah. Maka gaji
    // dinaikkan dua kali lipat setelah lembur disetujui: bila mesin gaji
    // menghitung ulang, angkanya ikut naik dan penguncian tidak ada artinya.
    const disetujui = await nilaiLembur(b.aditId, 3, false);
    assert.ok(disetujui.amount > 0);

    const slip = calculatePayroll({
      employeeId: b.aditId,
      fullName: 'Adit Uji',
      baseSalary: 20_000_000,
      ptkpStatus: 'TK/0', hasNpwp: true,
      enrollBpjsKes: false, enrollBpjsTk: false,
      components: [{
        code: 'TJ-UJI', name: 'Tunjangan Jabatan', type: 'ALLOWANCE',
        amount: TUNJANGAN, taxable: true, tetap: true,
      }],
      overtimeHours: 3, overtimeHolidayHours: 0,
      overtimeLocked: disetujui.amount,
      presentDays: 21, absentDays: 0, leaveDays: 0, unpaidLeaveDays: 0,
      lateMinutes: 0, loanDeduction: 0, workingDays: 21, cutAbsent: false,
      bpjs: BPJS_UJI,
    });

    assert.equal(slip.overtimePay, disetujui.amount,
      'nilai yang dikunci saat persetujuan harus dibayarkan apa adanya');

    // Pembanding: tanpa nilai terkunci, gaji yang naik memang menaikkan lembur.
    const tanpaKunci = calculatePayroll({
      employeeId: b.aditId,
      fullName: 'Adit Uji',
      baseSalary: 20_000_000,
      ptkpStatus: 'TK/0', hasNpwp: true,
      enrollBpjsKes: false, enrollBpjsTk: false,
      components: [{
        code: 'TJ-UJI', name: 'Tunjangan Jabatan', type: 'ALLOWANCE',
        amount: TUNJANGAN, taxable: true, tetap: true,
      }],
      overtimeHours: 3, overtimeHolidayHours: 0,
      presentDays: 21, absentDays: 0, leaveDays: 0, unpaidLeaveDays: 0,
      lateMinutes: 0, loanDeduction: 0, workingDays: 21, cutAbsent: false,
      bpjs: BPJS_UJI,
    });
    assert.ok(tanpaKunci.overtimePay > disetujui.amount,
      'uji ini tidak berarti apa-apa bila kedua jalur memberi angka sama');
  });

  test('tanpa nilai terkunci, mesin menghitung dari jam dan tunjangan tetap', async () => {
    const dasar = (n: number) => calculatePayroll({
      employeeId: b.aditId,
      fullName: 'Adit Uji',
      baseSalary: 10_000_000,
      ptkpStatus: 'TK/0', hasNpwp: true,
      enrollBpjsKes: false, enrollBpjsTk: false,
      components: [{
        code: 'TJ-UJI', name: 'Tunjangan Jabatan', type: 'ALLOWANCE',
        amount: n, taxable: true, tetap: true,
      }],
      overtimeHours: 3, overtimeHolidayHours: 0,
      presentDays: 21, absentDays: 0, leaveDays: 0, unpaidLeaveDays: 0,
      lateMinutes: 0, loanDeduction: 0, workingDays: 21, cutAbsent: false,
      bpjs: BPJS_UJI,
    }).overtimePay;

    // Tunjangan tetap yang lebih besar menaikkan upah sejam, jadi lemburnya
    // ikut naik. Bila tidak, berarti dasarnya kembali hanya gaji pokok.
    assert.ok(dasar(TUNJANGAN) > dasar(0), 'tunjangan tetap harus menaikkan upah lembur');
  });
});
