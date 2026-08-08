import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  OFFSET_MENIT, akhirPekan, awalBulan, dariYMD, hariIni, hariPekan,
  isoTanggal, kalender, pukul, selisihHari, tambahHari,
} from '../src/lib/waktu';

/**
 * Uji ini ada karena satu bug nyata: tanggal kalender dulu dibuat dengan
 * `new Date(y, m, d)`, sehingga hasilnya bergantung pada zona waktu mesin yang
 * menjalankan kode. Di laptop pengembang (WIB) dan di server produksi (UTC),
 * tanggal yang sama tersimpan tujuh jam berbeda.
 *
 * Yang penting bukan sekadar hasilnya benar, melainkan hasilnya sama di mana
 * pun kode ini dijalankan.
 */

describe('Tanggal kalender tidak bergantung zona server', () => {
  test('kalender selalu tengah malam UTC', () => {
    assert.equal(kalender('2026-11-02').toISOString(), '2026-11-02T00:00:00.000Z');
    assert.equal(dariYMD(2026, 11, 2).toISOString(), '2026-11-02T00:00:00.000Z');
  });

  test('kalender dan dariYMD sepakat', () => {
    for (const [y, m, d] of [[2026, 1, 1], [2026, 2, 28], [2024, 2, 29], [2026, 12, 31]] as const) {
      const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      assert.equal(kalender(iso).getTime(), dariYMD(y, m, d).getTime(), iso);
    }
  });

  test('tahun kabisat 29 Februari diterima', () => {
    assert.equal(kalender('2024-02-29').toISOString(), '2024-02-29T00:00:00.000Z');
  });

  test('bentuk tanggal yang tidak dikenali ditolak, bukan ditebak', () => {
    // Tanggal salah baca lebih berbahaya daripada penolakan: hasilnya berupa
    // angka yang tampak wajar dan tidak menimbulkan galat apa pun.
    assert.throws(() => kalender('bukan tanggal'), RangeError);
    assert.throws(() => kalender(''), RangeError);
  });
});

describe('Hari dalam pekan dibaca dari tanggal kalender', () => {
  test('2 November 2026 jatuh hari Senin', () => {
    assert.equal(hariPekan(kalender('2026-11-02')), 1);
    assert.equal(akhirPekan(kalender('2026-11-02')), false);
  });

  test('Sabtu dan Minggu dikenali akhir pekan', () => {
    assert.equal(akhirPekan(kalender('2026-11-07')), true); // Sabtu
    assert.equal(akhirPekan(kalender('2026-11-08')), true); // Minggu
    assert.equal(akhirPekan(kalender('2026-11-06')), false); // Jumat
  });

  test('tanggal kalender tidak bergeser meski dibaca sebagai UTC', () => {
    // getDay() lokal akan menggeser hari ini di zona negatif; getUTCDay() tidak.
    for (let i = 0; i < 14; i++) {
      const d = tambahHari(kalender('2026-11-01'), i);
      assert.equal(hariPekan(d), d.getUTCDay());
    }
  });
});

describe('Jam kerja ditafsirkan menurut zona perusahaan', () => {
  test('pukul 09.00 WIB adalah 02.00 UTC', () => {
    const hari = kalender('2026-08-10');
    assert.equal(pukul(hari, 9, 0).toISOString(), '2026-08-10T02:00:00.000Z');
  });

  test('ambang keterlambatan 09.15 WIB', () => {
    const hari = kalender('2026-08-10');
    assert.equal(pukul(hari, 9, 15).toISOString(), '2026-08-10T02:15:00.000Z');
  });

  test('offset yang dipakai memang UTC+7', () => {
    assert.equal(OFFSET_MENIT, 420);
    const hari = kalender('2026-08-10');
    assert.equal((pukul(hari, 7, 0).getTime() - hari.getTime()) / 60000, 0);
  });

  test('lewat tengah malam WIB masuk ke tanggal UTC sebelumnya', () => {
    // 01.00 WIB tanggal 10 = 18.00 UTC tanggal 9. Inilah sebabnya setHours()
    // pada server UTC tidak bisa dipakai untuk jam kerja Indonesia.
    assert.equal(pukul(kalender('2026-08-10'), 1, 0).toISOString(), '2026-08-09T18:00:00.000Z');
  });
});

describe('Hari ini menurut zona perusahaan', () => {
  test('23.30 WIB masih hari yang sama, bukan besok', () => {
    // 2026-08-10 23.30 WIB = 2026-08-10T16:30Z
    const saat = new Date('2026-08-10T16:30:00.000Z');
    assert.equal(isoTanggal(saat), '2026-08-10');
    assert.equal(hariIni(saat).toISOString(), '2026-08-10T00:00:00.000Z');
  });

  test('00.30 WIB sudah hari berikutnya meski UTC masih kemarin', () => {
    // 2026-08-11 00.30 WIB = 2026-08-10T17:30Z — server UTC masih tanggal 10,
    // tetapi bagi karyawan di Jakarta hari itu sudah tanggal 11.
    const saat = new Date('2026-08-10T17:30:00.000Z');
    assert.equal(isoTanggal(saat), '2026-08-11');
    assert.equal(hariIni(saat).toISOString(), '2026-08-11T00:00:00.000Z');
  });

  test('tepat tengah malam WIB', () => {
    assert.equal(isoTanggal(new Date('2026-08-10T17:00:00.000Z')), '2026-08-11');
    assert.equal(isoTanggal(new Date('2026-08-10T16:59:59.000Z')), '2026-08-10');
  });

  test('awal bulan berjalan', () => {
    assert.equal(awalBulan(new Date('2026-08-31T16:30:00.000Z')).toISOString(), '2026-08-01T00:00:00.000Z');
    // 1 September 00.30 WIB — bulannya sudah September, bukan Agustus.
    assert.equal(awalBulan(new Date('2026-08-31T17:30:00.000Z')).toISOString(), '2026-09-01T00:00:00.000Z');
  });
});

describe('Aritmetika tanggal', () => {
  test('menambah hari melewati pergantian bulan', () => {
    assert.equal(tambahHari(kalender('2026-01-31'), 1).toISOString(), '2026-02-01T00:00:00.000Z');
    assert.equal(tambahHari(kalender('2024-02-28'), 1).toISOString(), '2024-02-29T00:00:00.000Z');
    assert.equal(tambahHari(kalender('2026-12-31'), 1).toISOString(), '2027-01-01T00:00:00.000Z');
  });

  test('selisih hari', () => {
    assert.equal(selisihHari(kalender('2026-11-02'), kalender('2026-11-05')), 3);
    assert.equal(selisihHari(kalender('2026-11-05'), kalender('2026-11-02')), -3);
    assert.equal(selisihHari(kalender('2026-01-01'), kalender('2027-01-01')), 365);
  });

  test('penambahan hari tidak terpengaruh peralihan waktu musim panas', () => {
    // Zona yang menerapkan DST akan menghasilkan 23 atau 25 jam pada hari
    // peralihan. Karena tanggal kalender berbasis UTC, jaraknya selalu tepat.
    let d = kalender('2026-03-01');
    for (let i = 0; i < 60; i++) d = tambahHari(d, 1);
    assert.equal(d.toISOString(), '2026-04-30T00:00:00.000Z');
  });
});
