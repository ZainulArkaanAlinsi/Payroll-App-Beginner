import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePayroll,
  calcBpjs,
  overtimePay,
  workingDaysInPeriod,
  type BpjsConfig,
  type PayrollInput,
} from '../src/lib/payroll-engine';

const BPJS: BpjsConfig = {
  kesEmployeeRate: 1,
  kesEmployerRate: 4,
  kesCap: 12_000_000,
  jhtEmployeeRate: 2,
  jhtEmployerRate: 3.7,
  jpEmployeeRate: 1,
  jpEmployerRate: 2,
  jpCap: 10_547_400,
  jkkRate: 0.24,
  jkmRate: 0.3,
};

function dasar(patch: Partial<PayrollInput> = {}): PayrollInput {
  return {
    employeeId: 'e1',
    fullName: 'Uji Coba',
    baseSalary: 10_000_000,
    ptkpStatus: 'TK/0',
    hasNpwp: true,
    enrollBpjsKes: true,
    enrollBpjsTk: true,
    components: [],
    overtimeHours: 0,
    overtimeHolidayHours: 0,
    presentDays: 22,
    absentDays: 0,
    leaveDays: 0,
    unpaidLeaveDays: 0,
    lateMinutes: 0,
    loanDeduction: 0,
    workingDays: 22,
    cutAbsent: true,
    bpjs: BPJS,
    ...patch,
  };
}

describe('Lembur — Kepmenaker 102/2004', () => {
  test('hari kerja: jam pertama 1,5x lalu 2x', () => {
    const upah = 1_730_000; // upah sejam tepat 10.000
    const { amount } = overtimePay(upah, 3, 0);
    assert.equal(amount, Math.round(10_000 * 1.5 + 10_000 * 2 * 2));
  });

  test('hari libur: delapan jam pertama 2x, jam kesembilan 3x, sisanya 4x', () => {
    const upah = 1_730_000;
    const { amount } = overtimePay(upah, 0, 10);
    assert.equal(amount, Math.round(10_000 * 8 * 2 + 10_000 * 3 + 10_000 * 4));
  });

  test('tanpa jam lembur menghasilkan nol', () => {
    assert.equal(overtimePay(10_000_000, 0, 0).amount, 0);
  });
});

describe('Iuran BPJS', () => {
  test('Kesehatan dibatasi plafon 12 juta', () => {
    const b = calcBpjs(30_000_000, true, true, BPJS);
    assert.equal(b.kesEmployee, 120_000, '1% dari plafon, bukan dari upah penuh');
    assert.equal(b.kesEmployer, 480_000);
  });

  test('Jaminan Pensiun dibatasi plafonnya sendiri', () => {
    const b = calcBpjs(30_000_000, true, true, BPJS);
    assert.equal(b.jpEmployee, Math.round(10_547_400 * 0.01));
  });

  test('JHT tidak berplafon', () => {
    const b = calcBpjs(30_000_000, true, true, BPJS);
    assert.equal(b.jhtEmployee, 600_000, '2% dari upah penuh');
  });

  test('karyawan yang tidak didaftarkan tidak dipotong', () => {
    const b = calcBpjs(10_000_000, false, false, BPJS);
    assert.equal(b.kesEmployee + b.jhtEmployee + b.jpEmployee, 0);
    assert.equal(b.kesEmployer + b.jhtEmployer + b.jpEmployer, 0);
  });
});

describe('Hari kerja dalam periode', () => {
  test('menghitung Senin sampai Jumat saja', () => {
    // Agustus 2026: 31 hari, mulai Sabtu → 21 hari kerja
    assert.equal(workingDaysInPeriod('2026-08'), 21);
  });

  test('Februari tahun kabisat', () => {
    assert.equal(workingDaysInPeriod('2024-02'), 21);
  });
});

describe('Perhitungan gaji', () => {
  test('bruto dikurangi potongan selalu sama dengan yang diterima', () => {
    const h = calculatePayroll(
      dasar({
        components: [
          { code: 'A', name: 'Transport', type: 'ALLOWANCE', amount: 750_000, taxable: true },
          { code: 'B', name: 'Koperasi', type: 'DEDUCTION', amount: 100_000, taxable: false },
        ],
        overtimeHours: 4,
        loanDeduction: 500_000,
      }),
    );
    assert.equal(h.grossPay - h.totalDeduction, h.netPay, 'neraca slip harus seimbang');
  });

  test('hanya komponen bertanda yang menaikkan dasar BPJS', () => {
    const tanpa = calculatePayroll(
      dasar({
        components: [{ code: 'A', name: 'X', type: 'ALLOWANCE', amount: 2_000_000, taxable: true }],
      }),
    );
    const dengan = calculatePayroll(
      dasar({
        components: [
          { code: 'A', name: 'X', type: 'ALLOWANCE', amount: 2_000_000, taxable: true, countsForBpjs: true },
        ],
      }),
    );
    assert.equal(tanpa.bpjsJhtEmployee, Math.round(10_000_000 * 0.02));
    assert.equal(dengan.bpjsJhtEmployee, Math.round(12_000_000 * 0.02));
  });

  test('prorata memotong gaji pokok sesuai hari dibayar', () => {
    const h = calculatePayroll(dasar({ paidDays: 11, workingDays: 22 }));
    assert.equal(h.baseSalary, 5_000_000);
    assert.equal(h.prorateDays, 11);
  });

  test('komponen ber-prorata ikut dipotong, yang lain tidak', () => {
    const h = calculatePayroll(
      dasar({
        paidDays: 11,
        workingDays: 22,
        components: [
          { code: 'A', name: 'Ikut', type: 'ALLOWANCE', amount: 1_000_000, taxable: true, prorate: true },
          { code: 'B', name: 'Tetap', type: 'ALLOWANCE', amount: 1_000_000, taxable: true },
        ],
      }),
    );
    const baris = h.breakdown.filter((r) => r.group === 'EARNING');
    assert.equal(baris.find((r) => r.label === 'Ikut')?.amount, 500_000);
    assert.equal(baris.find((r) => r.label === 'Tetap')?.amount, 1_000_000);
  });

  test('mangkir memotong gaji bila kebijakan mengaktifkannya', () => {
    const potong = calculatePayroll(dasar({ absentDays: 2, cutAbsent: true }));
    const tidak = calculatePayroll(dasar({ absentDays: 2, cutAbsent: false }));
    assert.ok(potong.unpaidLeaveCut > 0);
    assert.equal(tidak.unpaidLeaveCut, 0);
  });

  test('aturan keterlambatan memakai toleransi dan plafon', () => {
    const h = calculatePayroll(
      dasar({
        lateMinutes: 100,
        latePolicy: { toleransiMenit: 30, potonganPerMenit: 2_500, potonganMaksPerBulan: 100_000 },
      }),
    );
    // (100 − 30) x 2.500 = 175.000, dibatasi plafon 100.000
    assert.equal(h.lateCut, 100_000);
  });

  test('lembur tarif rata mengabaikan pengganda resmi', () => {
    const h = calculatePayroll(
      dasar({ overtimeHours: 4, overtimePolicy: { metode: 'FLAT', tarifPerJam: 75_000 } }),
    );
    assert.equal(h.overtimePay, 300_000);
  });

  test('metode nett: pajak dipotong dari karyawan', () => {
    const h = calculatePayroll(dasar({ taxMethod: 'NETT' }));
    assert.equal(h.taxAllowance, 0);
    assert.ok(h.pph21 > 0);
  });

  test('metode gross up: tunjangan pajak menutup pajaknya sendiri', () => {
    const h = calculatePayroll(dasar({ taxMethod: 'GROSS_UP' }));
    assert.ok(h.taxAllowance > 0, 'harus ada tunjangan pajak');
    // Titik tetap: tunjangan pajak sama dengan pajak terutang, selisih
    // maksimal satu rupiah karena pembulatan.
    assert.ok(
      Math.abs(h.taxAllowance - h.pph21) <= 1,
      `tunjangan ${h.taxAllowance} vs pajak ${h.pph21} tidak konvergen`,
    );
  });

  test('gross up membuat karyawan menerima seolah tanpa pajak', () => {
    const nett = calculatePayroll(dasar({ taxMethod: 'NETT' }));
    const grossUp = calculatePayroll(dasar({ taxMethod: 'GROSS_UP' }));
    assert.ok(grossUp.netPay > nett.netPay);
    assert.ok(grossUp.employerCost > nett.employerCost, 'bebannya pindah ke perusahaan');
  });

  test('biaya perusahaan selalu melebihi bruto karena iuran pemberi kerja', () => {
    const h = calculatePayroll(dasar());
    assert.ok(h.employerCost > h.grossPay);
  });

  test('gaji bersih tidak pernah negatif walau potongan sangat besar', () => {
    const h = calculatePayroll(dasar({ loanDeduction: 999_000_000 }));
    assert.equal(h.netPay, 0);
  });
});
