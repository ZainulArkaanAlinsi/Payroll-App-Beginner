import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma';
import {
  approveRun, calculateRun, createRun, decideRunStep, deleteRun, payRun, reopenRun,
} from '../src/actions/payroll';
import { RedirectError } from '../scripts/test-stubs/next-navigation.mjs';
import { masuk, siapkan, tutup, type Bekal } from './helpers/bekal';

/**
 * Alur proses gaji: hitung, setujui, bayar.
 *
 * Inilah jalur tempat uang benar-benar berpindah dan status terkunci, dan
 * sampai sekarang tidak ada satu pun uji yang menjaganya. Kesalahan di sini
 * tidak menghasilkan galat — hanya periode yang terbayar dua kali, disetujui
 * oleh orang yang tidak berhak, atau dibayarkan dengan angka lama karena
 * seseorang mengubah data setelah perhitungan.
 *
 * Server action membaca sesi dari cookie. Yang dipalsukan hanya jar-nya;
 * tokennya tetap JWT sungguhan yang diverifikasi lib/auth.ts, jadi pembatasan
 * peran di bawah ini benar-benar diuji, bukan dilewati.
 */

let b: Bekal;

const form = (o: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) fd.append(k, v);
  return fd;
};

/** Buat periode baru dan kembalikan id-nya. */
async function buatPeriode(period: string, label = `Gaji ${period}`) {
  const hasil = await createRun({}, form({ period, label, payDate: `${period}-25`, kind: 'REGULAR' }));
  assert.equal(hasil.ok, true, hasil.error);
  const run = await prisma.payrollRun.findUnique({ where: { period } });
  assert.ok(run);
  return run.id;
}

/** Setujui seluruh tahap berurutan sebagai admin. */
async function setujuiSemua(runId: string) {
  const steps = await prisma.approvalStep.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });
  for (const s of steps) {
    const h = await decideRunStep(runId, s.id, 'APPROVED', '');
    assert.equal(h.ok, true, `tahap ${s.name}: ${h.error}`);
  }
  return steps;
}

before(async () => {
  b = await siapkan();
  await masuk('admin@uji.id');
});

after(tutup);

// Setiap blok mulai dari keadaan yang sama supaya urutannya tidak saling
// mempengaruhi — proses gaji penuh dengan status yang saling mengunci.
beforeEach(async () => {
  await prisma.runApproval.deleteMany();
  await prisma.payrollItem.deleteMany();
  await prisma.payrollRun.deleteMany();
  await masuk('admin@uji.id');
});

describe('Membuat periode', () => {
  test('periode baru dimulai sebagai draf', async () => {
    const id = await buatPeriode('2026-03');
    const run = await prisma.payrollRun.findUnique({ where: { id } });
    assert.equal(run?.status, 'DRAFT');
    assert.equal(run?.headcount, 0);
  });

  test('periode kembar ditolak', async () => {
    await buatPeriode('2026-03');
    const h = await createRun({}, form({ period: '2026-03', label: 'Ulangan', payDate: '2026-03-25', kind: 'REGULAR' }));
    assert.equal(h.ok, false, 'satu periode hanya boleh punya satu proses gaji');
  });

  test('karyawan biasa tidak bisa membuat periode', async () => {
    await masuk('adit@uji.id');
    await assert.rejects(
      () => createRun({}, form({ period: '2026-09', label: 'Diam-diam', payDate: '2026-09-25', kind: 'REGULAR' })),
      RedirectError,
      'penolakan akses wujudnya pengalihan, bukan hasil gagal biasa',
    );
    const ada = await prisma.payrollRun.count({ where: { period: '2026-09' } });
    assert.equal(ada, 0);
  });
});

describe('Menghitung', () => {
  test('perhitungan membuat slip dan mengisi total periode', async () => {
    const id = await buatPeriode('2026-03');
    const h = await calculateRun(id);
    assert.equal(h.ok, true, h.error);

    const run = await prisma.payrollRun.findUnique({ where: { id }, include: { items: true } });
    assert.equal(run?.status, 'CALCULATED');
    assert.ok(run!.items.length > 0, 'harus ada slip yang terbentuk');
    assert.equal(run!.headcount, run!.items.length);

    const bruto = run!.items.reduce((s, i) => s + i.grossPay, 0);
    const bersih = run!.items.reduce((s, i) => s + i.netPay, 0);
    assert.equal(run!.totalGross, bruto);
    assert.equal(run!.totalNet, bersih);
  });

  test('setiap slip menjaga bruto − potongan = diterima', async () => {
    const id = await buatPeriode('2026-03');
    await calculateRun(id);
    const items = await prisma.payrollItem.findMany({ where: { runId: id } });
    for (const i of items) {
      assert.equal(i.grossPay - i.totalDeduction, i.netPay);
      assert.ok(i.netPay >= 0, 'gaji diterima tidak boleh negatif');
    }
  });

  test('menghitung ulang tidak menggandakan slip', async () => {
    // Perhitungan selalu dimulai dari nol dan menarik ulang sumbernya. Bila
    // slip lama tidak dibersihkan, karyawan muncul dua kali di berkas transfer.
    const id = await buatPeriode('2026-03');
    await calculateRun(id);
    const pertama = await prisma.payrollItem.count({ where: { runId: id } });
    await calculateRun(id);
    const kedua = await prisma.payrollItem.count({ where: { runId: id } });
    assert.equal(kedua, pertama);
  });

  test('periode yang sudah dibayarkan tidak bisa dihitung ulang', async () => {
    const id = await buatPeriode('2026-03');
    await calculateRun(id);
    await setujuiSemua(id);
    await payRun(id);

    const h = await calculateRun(id);
    assert.equal(h.ok, false, 'angka periode terbayar harus terkunci selamanya');
  });
});

describe('Persetujuan bertahap', () => {
  test('melompati tahap ditolak', async () => {
    const id = await buatPeriode('2026-03');
    await calculateRun(id);

    const steps = await prisma.approvalStep.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });
    assert.ok(steps.length >= 2, 'uji ini butuh minimal dua tahap');

    const h = await decideRunStep(id, steps[1].id, 'APPROVED', '');
    assert.equal(h.ok, false, 'tahap kedua tidak boleh diputuskan sebelum tahap pertama');
  });

  test('menyetujui tahap terakhir langsung menyetujui periodenya', async () => {
    const id = await buatPeriode('2026-03');
    await calculateRun(id);
    await setujuiSemua(id);

    const run = await prisma.payrollRun.findUnique({ where: { id } });
    assert.equal(run?.status, 'APPROVED');
    assert.ok(run?.approvedAt, 'waktu persetujuan harus tercatat');
    assert.ok(run?.approvedBy, 'penyetujunya harus tercatat');
  });

  test('persetujuan sekali jalan ditolak selama alur bertahap dipakai', async () => {
    // approveRun hanya untuk perusahaan yang belum menyusun tahapan. Bila
    // tetap diizinkan, seluruh tahapan bisa dilewati dengan satu panggilan.
    const id = await buatPeriode('2026-03');
    await calculateRun(id);

    const h = await approveRun(id);
    assert.equal(h.ok, false);
    assert.match(h.error ?? '', /bertahap/);
  });

  test('tanpa tahapan, persetujuan sekali jalan berlaku', async () => {
    const tahap = await prisma.approvalStep.findMany();
    await prisma.approvalStep.updateMany({ data: { active: false } });

    const id = await buatPeriode('2026-04');
    await calculateRun(id);
    const h = await approveRun(id);
    assert.equal(h.ok, true, h.error);
    assert.equal((await prisma.payrollRun.findUnique({ where: { id } }))?.status, 'APPROVED');

    for (const t of tahap) {
      await prisma.approvalStep.update({ where: { id: t.id }, data: { active: true } });
    }
  });

  test('penolakan di satu tahap menghapus persetujuan sebelumnya', async () => {
    // Alurnya harus diulang dari awal: yang sudah menyetujui belum tentu
    // menyetujui lagi setelah tahu ada yang menolak.
    const id = await buatPeriode('2026-03');
    await calculateRun(id);
    const steps = await prisma.approvalStep.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });

    await decideRunStep(id, steps[0].id, 'APPROVED', '');
    assert.equal(await prisma.runApproval.count({ where: { runId: id, decision: 'APPROVED' } }), 1);

    await decideRunStep(id, steps[1].id, 'REJECTED', 'Angka lembur perlu diperiksa');
    assert.equal(
      await prisma.runApproval.count({ where: { runId: id, decision: 'APPROVED' } }),
      0,
      'persetujuan sebelumnya harus hangus',
    );
  });

  test('menghitung ulang membatalkan seluruh persetujuan', async () => {
    // Yang disetujui adalah angkanya. Begitu angkanya berubah, persetujuan
    // atas angka lama tidak berlaku lagi.
    const id = await buatPeriode('2026-03');
    await calculateRun(id);
    await setujuiSemua(id);
    assert.ok((await prisma.runApproval.count({ where: { runId: id } })) > 0);

    await reopenRun(id);
    await calculateRun(id);
    assert.equal(await prisma.runApproval.count({ where: { runId: id, decision: 'APPROVED' } }), 0);
  });

  test('karyawan biasa tidak bisa memutuskan tahap', async () => {
    const id = await buatPeriode('2026-03');
    await calculateRun(id);
    const steps = await prisma.approvalStep.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });

    await masuk('adit@uji.id');
    await assert.rejects(() => decideRunStep(id, steps[0].id, 'APPROVED', ''), RedirectError);
  });
});

describe('Pembayaran', () => {
  test('membayar sebelum disetujui ditolak', async () => {
    const id = await buatPeriode('2026-03');
    await calculateRun(id);
    const h = await payRun(id);
    assert.equal(h.ok, false, 'uang tidak boleh keluar tanpa persetujuan');

    const run = await prisma.payrollRun.findUnique({ where: { id } });
    assert.notEqual(run?.status, 'PAID');
  });

  test('membayar setelah disetujui mengunci periode', async () => {
    const id = await buatPeriode('2026-03');
    await calculateRun(id);
    await setujuiSemua(id);

    const h = await payRun(id);
    assert.equal(h.ok, true, h.error);

    const run = await prisma.payrollRun.findUnique({ where: { id } });
    assert.equal(run?.status, 'PAID');
    assert.ok(run?.paidAt, 'tanggal pembayaran harus tercatat');
  });

  test('membayar dua kali ditolak', async () => {
    const id = await buatPeriode('2026-03');
    await calculateRun(id);
    await setujuiSemua(id);
    await payRun(id);

    const h = await payRun(id);
    assert.equal(h.ok, false, 'pembayaran ganda adalah uang yang benar-benar keluar dua kali');
  });

  test('cicilan pinjaman berkurang tepat sekali', async () => {
    // Kalau saldo dikurangi saat menghitung, menghitung ulang akan
    // menguranginya berkali-kali; kalau tidak dikurangi sama sekali, pinjaman
    // tidak pernah lunas.
    const pinjaman = await prisma.loan.create({
      data: {
        employeeId: b.aditId, principal: 6_000_000, tenorMonths: 6,
        monthlyDeduction: 1_000_000, remaining: 6_000_000,
        startPeriod: '2026-01', status: 'ACTIVE',
      },
    });

    const id = await buatPeriode('2026-03');
    await calculateRun(id);
    assert.equal(
      (await prisma.loan.findUnique({ where: { id: pinjaman.id } }))?.remaining,
      6_000_000,
      'menghitung tidak boleh mengubah saldo pinjaman',
    );

    await setujuiSemua(id);
    await payRun(id);

    const sesudah = await prisma.loan.findUnique({ where: { id: pinjaman.id } });
    assert.equal(sesudah?.remaining, 5_000_000, 'saldo berkurang tepat satu cicilan');

    await prisma.loan.delete({ where: { id: pinjaman.id } });
  });

  test('periode terbayar tidak bisa dihapus', async () => {
    const id = await buatPeriode('2026-03');
    await calculateRun(id);
    await setujuiSemua(id);
    await payRun(id);

    const h = await deleteRun(id);
    assert.equal(h.ok, false);
    assert.ok(await prisma.payrollRun.findUnique({ where: { id } }), 'periode harus tetap ada');
  });

  test('karyawan biasa tidak bisa membayar', async () => {
    const id = await buatPeriode('2026-03');
    await calculateRun(id);
    await setujuiSemua(id);

    await masuk('adit@uji.id');
    await assert.rejects(() => payRun(id), RedirectError);

    await masuk('admin@uji.id');
    const run = await prisma.payrollRun.findUnique({ where: { id } });
    assert.notEqual(run?.status, 'PAID');
  });
});

describe('Draf', () => {
  test('draf bisa dihapus', async () => {
    const id = await buatPeriode('2026-03');
    const h = await deleteRun(id);
    assert.equal(h.ok, true, h.error);
    assert.equal(await prisma.payrollRun.findUnique({ where: { id } }), null);
  });

  test('menghapus periode ikut menghapus slip di dalamnya', async () => {
    const id = await buatPeriode('2026-03');
    await calculateRun(id);
    assert.ok((await prisma.payrollItem.count({ where: { runId: id } })) > 0);

    await reopenRun(id);
    await deleteRun(id);
    assert.equal(await prisma.payrollItem.count({ where: { runId: id } }), 0, 'slip yatim tidak boleh tertinggal');
  });
});
