import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { evalFormula, validateFormula, FormulaError, type Variables } from '../src/lib/formula';

const V: Variables = {
  GAJI_POKOK: 8_000_000,
  TUNJANGAN_TETAP: 2_000_000,
  UPAH_SEJAM: 57_803,
  HARI_KERJA: 22,
  HARI_HADIR: 20,
  HARI_MANGKIR: 1,
  HARI_CUTI: 1,
  JAM_LEMBUR: 6,
  JAM_LEMBUR_LIBUR: 4,
  MENIT_TELAT: 45,
  MASA_KERJA_BULAN: 30,
  JUMLAH_TANGGUNGAN: 2,
  HARI_DIBAYAR: 22,
};

describe('Rumus yang sah', () => {
  const kasus: [string, number][] = [
    ['1000000', 1_000_000],
    ['GAJI_POKOK * 0.05', 400_000],
    ['MIN(GAJI_POKOK * 0.05; 500000)', 400_000],
    ['MIN(GAJI_POKOK * 0.1; 500000)', 500_000],
    ['MAX(GAJI_POKOK * 0.01; 250000)', 250_000],
    ['IF(MASA_KERJA_BULAN >= 12; 1000000; 500000)', 1_000_000],
    ['IF(MASA_KERJA_BULAN >= 60; 1000000; 500000)', 500_000],
    ['GAJI_POKOK / HARI_KERJA * HARI_HADIR', 7_272_727],
    ['(GAJI_POKOK + TUNJANGAN_TETAP) * 2', 20_000_000],
    ['2 ^ 10', 1024],
    ['ROUND(GAJI_POKOK / 3)', 2_666_667],
    ['FLOOR(MASA_KERJA_BULAN / 12) * 250000', 500_000],
    ['ABS(0 - 5000)', 5000],
    ['IF(HARI_MANGKIR > 0; GAJI_POKOK / HARI_KERJA * HARI_MANGKIR; 0)', 363_636],
  ];

  for (const [rumus, harap] of kasus) {
    test(rumus, () => {
      assert.equal(evalFormula(rumus, V).nilai, harap);
    });
  }
});

describe('Kebiasaan penulisan angka Indonesia', () => {
  test('koma dibaca sebagai desimal', () => {
    assert.equal(evalFormula('JAM_LEMBUR * UPAH_SEJAM * 1,5', V).nilai, Math.round(6 * 57_803 * 1.5));
  });

  test('titik sebagai pemisah ribuan diabaikan', () => {
    assert.equal(evalFormula('1.000.000 + 500.000', V).nilai, 1_500_000);
  });

  test('titik koma memisahkan argumen, koma tidak', () => {
    // Sengaja ditolak, bukan ditebak: MIN(1,5; 2) ambigu.
    assert.equal(evalFormula('MIN(1,5; 2)', V).nilai, 2);
    const v = validateFormula('MIN(5000000, 3000000)');
    assert.equal(v.ok, false);
    if (!v.ok) assert.match(v.pesan, /titik koma/i, 'pesannya harus mengajarkan cara benarnya');
  });

  test('desimal koma tidak tertukar dengan pemisah argumen', () => {
    assert.equal(evalFormula('MIN(GAJI_POKOK * 0,05; 500000)', V).nilai, 400_000);
  });
});

describe('Tanda minus di awal', () => {
  test('negatif unary dibaca benar', () => {
    assert.equal(evalFormula('-GAJI_POKOK + 10000000', V).nilai, 2_000_000);
  });

  test('negatif di dalam kurung', () => {
    assert.equal(evalFormula('MAX(-500; 0)', V).nilai, 0);
  });
});

describe('Pembagian nol', () => {
  test('menghasilkan nol, bukan tak terhingga', () => {
    // Nilai gaji tak terhingga jauh lebih berbahaya daripada nol.
    assert.equal(evalFormula('GAJI_POKOK / 0', V).nilai, 0);
  });
});

describe('Masukan berbahaya ditolak', () => {
  const jahat = [
    'process.exit(1)',
    'require("fs")',
    'constructor',
    'globalThis',
    '__proto__',
    'GAJI_POKOK; DROP TABLE karyawan',
    'eval("1+1")',
  ];

  for (const rumus of jahat) {
    test(`menolak: ${rumus}`, () => {
      const v = validateFormula(rumus);
      assert.equal(v.ok, false, 'rumus berbahaya tidak boleh lolos');
    });
  }
});

describe('Rumus rusak ditolak dengan pesan', () => {
  const rusak: [string, string][] = [
    ['', 'kosong'],
    ['((1+2)', 'kurung tidak ditutup'],
    ['1 +', 'operator menggantung'],
    ['GAJI_HANTU * 2', 'variabel tidak dikenal'],
    ['FOO(1;2)', 'fungsi tidak dikenal'],
    ['IF(1;2)', 'argumen IF kurang'],
    ['MIN(5)', 'argumen MIN kurang'],
    ['1 2 3', 'bagian berlebih'],
  ];

  for (const [rumus, ket] of rusak) {
    test(`${ket}: "${rumus}"`, () => {
      const v = validateFormula(rumus);
      assert.equal(v.ok, false);
      if (!v.ok) assert.ok(v.pesan.length > 0, 'harus menjelaskan salahnya di mana');
    });
  }

  test('melempar FormulaError, bukan galat mentah', () => {
    assert.throws(() => evalFormula('GAJI_HANTU', V), FormulaError);
  });
});

describe('Validasi memberi hasil contoh', () => {
  test('rumus sah mengembalikan angka perkiraan', () => {
    const v = validateFormula('HARI_HADIR * 45000');
    assert.equal(v.ok, true);
    if (v.ok) assert.ok(v.contoh > 0);
  });
});
