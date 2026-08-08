import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  PTKP,
  terCategory,
  terRate,
  biayaJabatan,
  pph21Ter,
  pph21Progressive,
} from '../src/lib/tax';

describe('PTKP', () => {
  test('nilai setahun sesuai UU HPP', () => {
    assert.equal(PTKP['TK/0'], 54_000_000);
    assert.equal(PTKP['K/0'], 58_500_000);
    assert.equal(PTKP['K/3'], 72_000_000);
  });

  test('tiap tanggungan menambah 4,5 juta', () => {
    assert.equal(PTKP['TK/1'] - PTKP['TK/0'], 4_500_000);
    assert.equal(PTKP['K/2'] - PTKP['K/1'], 4_500_000);
  });
});

describe('Kategori TER', () => {
  test('kategori A untuk TK/0, TK/1, dan K/0', () => {
    for (const p of ['TK/0', 'TK/1', 'K/0'] as const) {
      assert.equal(terCategory(p), 'A', `${p} seharusnya kategori A`);
    }
  });

  test('kategori B untuk TK/2, TK/3, K/1, dan K/2', () => {
    for (const p of ['TK/2', 'TK/3', 'K/1', 'K/2'] as const) {
      assert.equal(terCategory(p), 'B', `${p} seharusnya kategori B`);
    }
  });

  test('kategori C hanya untuk K/3', () => {
    assert.equal(terCategory('K/3'), 'C');
  });
});

describe('Tarif efektif TER', () => {
  test('penghasilan di bawah ambang tidak dipotong', () => {
    assert.equal(terRate('TK/0', 5_400_000), 0);
    assert.equal(terRate('K/1', 6_200_000), 0);
    assert.equal(terRate('K/3', 6_600_000), 0);
  });

  test('tepat di batas lapisan memakai tarif lapisan itu', () => {
    // Batas atas lapisan bersifat inklusif.
    assert.equal(terRate('TK/0', 5_650_000), 0.25);
    assert.equal(terRate('TK/0', 5_650_001), 0.5);
  });

  test('tarif naik seiring penghasilan, tidak pernah turun', () => {
    let sebelum = -1;
    for (let bruto = 5_000_000; bruto <= 200_000_000; bruto += 2_500_000) {
      const t = terRate('TK/0', bruto);
      assert.ok(t >= sebelum, `tarif turun pada bruto ${bruto}`);
      sebelum = t;
    }
  });

  test('penghasilan sangat besar mentok di 34%', () => {
    assert.equal(terRate('TK/0', 2_000_000_000), 34);
  });
});

describe('PPh 21 metode TER', () => {
  test('menghitung tarif dikali bruto', () => {
    const h = pph21Ter(16_812_000, 'TK/0', true);
    assert.equal(h.method, 'TER');
    assert.equal(h.rate, 7);
    assert.equal(h.tax, Math.round(16_812_000 * 0.07));
  });

  test('tanpa NPWP dikenakan 20% lebih tinggi', () => {
    const dengan = pph21Ter(16_812_000, 'TK/0', true);
    const tanpa = pph21Ter(16_812_000, 'TK/0', false);
    assert.equal(tanpa.tax, dengan.tax + Math.round(dengan.tax * 0.2));
  });

  test('penghasilan di bawah ambang menghasilkan nol', () => {
    assert.equal(pph21Ter(5_000_000, 'TK/0', true).tax, 0);
  });

  test('sanksi tanpa NPWP tidak mengubah nol menjadi bukan nol', () => {
    assert.equal(pph21Ter(5_000_000, 'TK/0', false).tax, 0);
  });
});

describe('Biaya jabatan', () => {
  test('5% dari bruto', () => {
    assert.equal(biayaJabatan(8_000_000), 400_000);
  });

  test('dibatasi 500 ribu sebulan', () => {
    assert.equal(biayaJabatan(50_000_000), 500_000);
  });

  test('plafon setahun dua belas kali plafon sebulan', () => {
    assert.equal(biayaJabatan(600_000_000, 12), 6_000_000);
  });
});

describe('PPh 21 progresif', () => {
  test('penghasilan di bawah PTKP tidak dipotong', () => {
    const h = pph21Progressive(50_000_000, 'TK/0', true);
    assert.equal(h.tax, 0);
  });

  test('lapisan pertama 5%', () => {
    // Bruto 120 juta: biaya jabatan 6 juta, PTKP 54 juta, PKP 60 juta.
    const h = pph21Progressive(120_000_000, 'TK/0', true);
    assert.equal(h.taxableBase, 60_000_000);
    assert.equal(h.tax, 3_000_000);
  });

  test('memotong pajak yang sudah dibayar sepanjang tahun', () => {
    const penuh = pph21Progressive(120_000_000, 'TK/0', true).tax;
    const sisa = pph21Progressive(120_000_000, 'TK/0', true, 2_000_000).tax;
    assert.equal(sisa, penuh - 2_000_000);
  });

  test('tidak pernah menghasilkan pajak negatif', () => {
    const h = pph21Progressive(120_000_000, 'TK/0', true, 999_000_000);
    assert.equal(h.tax, 0);
  });

  test('iuran BPJS karyawan mengurangi penghasilan neto', () => {
    const tanpa = pph21Progressive(200_000_000, 'TK/0', true, 0, 0).tax;
    const dengan = pph21Progressive(200_000_000, 'TK/0', true, 0, 10_000_000).tax;
    assert.ok(dengan < tanpa, 'iuran BPJS seharusnya menurunkan pajak');
  });
});
