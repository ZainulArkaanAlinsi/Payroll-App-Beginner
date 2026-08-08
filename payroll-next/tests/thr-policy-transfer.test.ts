import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { hitungThr, masaKerjaBulan, pajakThr, batasPembayaran } from '../src/lib/thr';
import {
  pilihAturan,
  lateConfigDari,
  overtimeConfigDari,
  hitungPotonganTelat,
  type PolicyRow,
} from '../src/lib/policy';
import { periksaTransfer, ringkasTransfer, type BarisTransfer } from '../src/lib/transfer';
import { periksaKepatuhan } from '../src/lib/kepatuhan';

// ───────────────────────────── THR ─────────────────────────────

describe('THR — Permenaker 6/2016', () => {
  const UPAH = 6_000_000;

  test('masa kerja kurang dari sebulan belum berhak', () => {
    assert.equal(hitungThr(UPAH, 0).amount, 0);
  });

  test('dua belas bulan atau lebih berhak sebulan penuh', () => {
    assert.equal(hitungThr(UPAH, 12).amount, UPAH);
    assert.equal(hitungThr(UPAH, 60).amount, UPAH, 'tidak berlipat walau bekerja lima tahun');
  });

  test('satu sampai dua belas bulan diprorata', () => {
    assert.equal(hitungThr(UPAH, 1).amount, 500_000);
    assert.equal(hitungThr(UPAH, 6).amount, 3_000_000);
    assert.equal(hitungThr(UPAH, 11).amount, 5_500_000);
  });

  test('menandai penerima penuh', () => {
    assert.equal(hitungThr(UPAH, 12).full, true);
    assert.equal(hitungThr(UPAH, 11).full, false);
  });
});

describe('Masa kerja', () => {
  test('bulan berjalan belum dihitung sebelum tanggalnya lewat', () => {
    assert.equal(masaKerjaBulan(new Date('2025-08-20'), new Date('2026-08-19')), 11);
    assert.equal(masaKerjaBulan(new Date('2025-08-20'), new Date('2026-08-20')), 12);
  });

  test('baru bergabung menghasilkan nol', () => {
    assert.equal(masaKerjaBulan(new Date('2026-08-01'), new Date('2026-08-08')), 0);
  });

  test('tidak pernah negatif walau tanggalnya terbalik', () => {
    assert.equal(masaKerjaBulan(new Date('2027-01-01'), new Date('2026-01-01')), 0);
  });
});

describe('Pajak THR — metode selisih', () => {
  test('selisih pajak dengan dan tanpa THR', () => {
    const tarif = (b: number) => Math.round(b * 0.05);
    const h = pajakThr(10_000_000, 6_000_000, tarif);
    assert.equal(h.pajak, 300_000);
    assert.equal(h.pajakDenganThr - h.pajakTanpaThr, h.pajak);
  });

  test('tidak pernah negatif', () => {
    const h = pajakThr(10_000_000, 0, () => 500_000);
    assert.equal(h.pajak, 0);
  });
});

describe('Batas pembayaran THR', () => {
  test('tujuh hari sebelum hari raya', () => {
    const b = batasPembayaran(new Date('2026-03-20T00:00:00Z'));
    assert.equal(b.toISOString().slice(0, 10), '2026-03-13');
  });
});

// ──────────────────────── Aturan per divisi ────────────────────────

const ATURAN: PolicyRow[] = [
  {
    id: '1', name: 'Umum', kind: 'LATE', priority: 0, active: true,
    scopeDepartmentId: null, scopeLevel: null,
    config: JSON.stringify({ toleransiMenit: 30, potonganPerMenit: 2500, potonganMaksPerBulan: 500000 }),
  },
  {
    id: '2', name: 'Operasional', kind: 'LATE', priority: 10, active: true,
    scopeDepartmentId: 'ops', scopeLevel: null,
    config: JSON.stringify({ toleransiMenit: 10, potonganPerMenit: 4000, potonganMaksPerBulan: 750000 }),
  },
  {
    id: '3', name: 'Direktur dikecualikan', kind: 'LATE', priority: 20, active: true,
    scopeDepartmentId: null, scopeLevel: 'DIRECTOR',
    config: JSON.stringify({ toleransiMenit: 0, potonganPerMenit: 0, potonganMaksPerBulan: 0 }),
  },
  {
    id: '4', name: 'Lembur umum', kind: 'OVERTIME', priority: 0, active: true,
    scopeDepartmentId: null, scopeLevel: null,
    config: JSON.stringify({ metode: 'KEPMENAKER', pembagi: 173 }),
  },
  {
    id: '5', name: 'Lembur teknologi', kind: 'OVERTIME', priority: 10, active: true,
    scopeDepartmentId: 'eng', scopeLevel: null,
    config: JSON.stringify({ metode: 'FLAT', tarifPerJam: 75000 }),
  },
];

describe('Pemilihan aturan divisi', () => {
  test('aturan bertingkat jabatan mengalahkan aturan berdepartemen', () => {
    const r = pilihAturan(ATURAN, 'LATE', 'ops', 'DIRECTOR');
    assert.equal(r?.name, 'Direktur dikecualikan');
  });

  test('aturan berdepartemen mengalahkan aturan umum', () => {
    const r = pilihAturan(ATURAN, 'LATE', 'ops', 'STAFF');
    assert.equal(r?.name, 'Operasional');
  });

  test('tanpa aturan khusus memakai aturan umum', () => {
    const r = pilihAturan(ATURAN, 'LATE', 'fin', 'STAFF');
    assert.equal(r?.name, 'Umum');
  });

  test('aturan nonaktif diabaikan', () => {
    const mati = ATURAN.map((a) => (a.id === '2' ? { ...a, active: false } : a));
    assert.equal(pilihAturan(mati, 'LATE', 'ops', 'STAFF')?.name, 'Umum');
  });

  test('memilih metode lembur yang tepat per divisi', () => {
    assert.equal(overtimeConfigDari(pilihAturan(ATURAN, 'OVERTIME', 'eng', 'STAFF')).metode, 'FLAT');
    assert.equal(overtimeConfigDari(pilihAturan(ATURAN, 'OVERTIME', 'fin', 'STAFF')).metode, 'KEPMENAKER');
  });

  test('tanpa aturan sama sekali memakai nilai aman', () => {
    const c = lateConfigDari(pilihAturan([], 'LATE', null, null));
    assert.equal(c.potonganPerMenit, 0, 'tanpa aturan tidak boleh memotong gaji');
  });
});

describe('Potongan keterlambatan', () => {
  test('toleransi tidak dipotong', () => {
    assert.equal(hitungPotonganTelat(20, { toleransiMenit: 30, potonganPerMenit: 2500, potonganMaksPerBulan: 0 }), 0);
  });

  test('plafon nol berarti tanpa batas atas', () => {
    const n = hitungPotonganTelat(1000, { toleransiMenit: 0, potonganPerMenit: 2500, potonganMaksPerBulan: 0 });
    assert.equal(n, 2_500_000);
  });
});

// ─────────────────── Pemeriksaan sebelum transfer ───────────────────

const BARIS: BarisTransfer[] = [
  { employeeId: '1', nama: 'Sah', bankName: 'BCA', bankAccount: '1234567890', bankHolder: 'Sah', netPay: 5_000_000 },
  { employeeId: '2', nama: 'Tanpa rekening', bankName: 'BCA', bankAccount: null, bankHolder: null, netPay: 5_000_000 },
  { employeeId: '3', nama: 'Ada spasi', bankName: 'BCA', bankAccount: '123 456-789', bankHolder: 'Ada spasi', netPay: 5_000_000 },
  { employeeId: '4', nama: 'Kembar A', bankName: 'BNI', bankAccount: '9999999999', bankHolder: 'Kembar A', netPay: 5_000_000 },
  { employeeId: '5', nama: 'Kembar B', bankName: 'BNI', bankAccount: '9999999999', bankHolder: 'Kembar B', netPay: 5_000_000 },
  { employeeId: '6', nama: 'Nol', bankName: 'BRI', bankAccount: '1111111111', bankHolder: 'Nol', netPay: 0 },
];

describe('Pemeriksaan sebelum transfer', () => {
  const temuan = periksaTransfer(BARIS);
  const kode = (k: string) => temuan.find((t) => t.kode === k);

  test('menangkap rekening kosong', () => {
    assert.ok(kode('REKENING_KOSONG'));
    assert.equal(kode('REKENING_KOSONG')!.tingkat, 'PENGHALANG');
  });

  test('menangkap rekening berisi spasi atau tanda hubung', () => {
    assert.ok(kode('REKENING_BUKAN_ANGKA'));
  });

  test('menangkap rekening dipakai dua karyawan', () => {
    const t = kode('REKENING_KEMBAR');
    assert.ok(t);
    assert.equal(t!.terdampak.length, 2);
  });

  test('menangkap nominal nol', () => {
    assert.ok(kode('NOMINAL_TIDAK_SAH'));
  });

  test('baris yang sah tidak dilaporkan', () => {
    for (const t of temuan) {
      assert.ok(!t.terdampak.some((d) => d.nama === 'Sah'), `baris sah masuk temuan ${t.kode}`);
    }
  });

  test('data bersih menghasilkan nol temuan', () => {
    assert.equal(periksaTransfer([BARIS[0]]).length, 0);
  });

  test('lonjakan nominal hanya peringatan, bukan penghalang', () => {
    const t = periksaTransfer([{ ...BARIS[0], netPay: 20_000_000, netPayLalu: 5_000_000 }]);
    assert.equal(t[0].kode, 'LONJAKAN');
    assert.equal(t[0].tingkat, 'PERINGATAN');
  });
});

describe('Ringkasan transfer', () => {
  test('menjumlahkan nominal dan mengelompokkan per bank', () => {
    const r = ringkasTransfer(BARIS);
    assert.equal(r.jumlahPenerima, 6);
    assert.equal(r.totalNominal, 25_000_000);
    assert.equal(r.perBank.find((b) => b.bank === 'BNI')?.jumlah, 2);
  });

  test('diurutkan dari nominal terbesar', () => {
    const r = ringkasTransfer(BARIS);
    for (let i = 1; i < r.perBank.length; i++) {
      assert.ok(r.perBank[i - 1].nominal >= r.perBank[i].nominal);
    }
  });
});

// ──────────────────────── Kepatuhan ────────────────────────

describe('Kepatuhan ketenagakerjaan', () => {
  const opsi = { upahMinimum: 5_396_761, wilayah: 'DKI Jakarta', periksaRasioPokok: true };

  test('menangkap upah di bawah upah minimum', () => {
    const t = periksaKepatuhan(
      [{ id: '1', nama: 'Kurang', gajiPokok: 4_000_000, tunjanganTetap: 500_000, status: 'ACTIVE' }],
      opsi,
    );
    assert.equal(t[0].kode, 'DI_BAWAH_UMK');
    assert.equal(t[0].tingkat, 'PELANGGARAN');
  });

  test('menangkap gaji pokok kurang dari 75% total upah', () => {
    const t = periksaKepatuhan(
      [{ id: '1', nama: 'Timpang', gajiPokok: 5_000_000, tunjanganTetap: 5_000_000, status: 'ACTIVE' }],
      opsi,
    );
    assert.equal(t[0].kode, 'RASIO_POKOK');
  });

  test('karyawan yang sudah keluar diabaikan', () => {
    const t = periksaKepatuhan(
      [{ id: '1', nama: 'Keluar', gajiPokok: 1_000_000, tunjanganTetap: 0, status: 'RESIGNED' }],
      opsi,
    );
    assert.equal(t.length, 0);
  });

  test('tanpa tunjangan tetap rasionya otomatis penuh', () => {
    const t = periksaKepatuhan(
      [{ id: '1', nama: 'Polos', gajiPokok: 6_000_000, tunjanganTetap: 0, status: 'ACTIVE' }],
      opsi,
    );
    assert.equal(t.length, 0);
  });

  test('struktur upah yang sah tidak dilaporkan', () => {
    const t = periksaKepatuhan(
      [{ id: '1', nama: 'Aman', gajiPokok: 8_000_000, tunjanganTetap: 1_500_000, status: 'ACTIVE' }],
      opsi,
    );
    assert.equal(t.length, 0);
  });

  test('pemeriksaan rasio bisa dimatikan HR', () => {
    const t = periksaKepatuhan(
      [{ id: '1', nama: 'Timpang', gajiPokok: 5_000_000, tunjanganTetap: 5_000_000, status: 'ACTIVE' }],
      { ...opsi, periksaRasioPokok: false },
    );
    assert.equal(t.length, 0);
  });
});
