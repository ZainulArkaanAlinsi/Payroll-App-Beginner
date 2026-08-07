/**
 * Mesin penggajian NusaPay.
 *
 * Alur satu karyawan dalam satu periode:
 *   gaji pokok (disesuaikan kehadiran)
 *   + tunjangan kena pajak + tunjangan bebas pajak
 *   + upah lembur
 *   = BRUTO
 *   − iuran BPJS bagian karyawan
 *   − potongan komponen, cicilan, potongan telat, potongan mangkir
 *   − PPh 21
 *   = TAKE HOME PAY
 *
 * Sisi perusahaan dihitung terpisah sebagai employerCost supaya laporan
 * biaya SDM sesungguhnya (bukan cuma yang dibayar ke karyawan) tersedia.
 */

import { pph21Ter, pph21Progressive, type PtkpStatus } from './tax';

export interface BpjsConfig {
  kesEmployeeRate: number;
  kesEmployerRate: number;
  kesCap: number;
  jhtEmployeeRate: number;
  jhtEmployerRate: number;
  jpEmployeeRate: number;
  jpEmployerRate: number;
  jpCap: number;
  jkkRate: number;
  jkmRate: number;
}

export interface ComponentLine {
  code: string;
  name: string;
  type: 'ALLOWANCE' | 'DEDUCTION';
  amount: number;
  taxable: boolean;
}

export interface PayrollInput {
  employeeId: string;
  fullName: string;
  baseSalary: number;
  ptkpStatus: PtkpStatus;
  hasNpwp: boolean;
  enrollBpjsKes: boolean;
  enrollBpjsTk: boolean;
  components: ComponentLine[];
  overtimeHours: number;
  overtimeHolidayHours: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  unpaidLeaveDays: number;
  lateMinutes: number;
  loanDeduction: number;
  workingDays: number;
  lateCutPerMinute: number;
  cutAbsent: boolean;
  bpjs: BpjsConfig;
  isDecember?: boolean;
  ytdGross?: number;
  ytdTax?: number;
  ytdBpjsEmployee?: number;
}

export interface BreakdownRow {
  group: 'EARNING' | 'DEDUCTION' | 'EMPLOYER';
  label: string;
  amount: number;
  note?: string;
}

export interface PayrollResult {
  baseSalary: number;
  allowanceTaxable: number;
  allowanceNonTax: number;
  overtimePay: number;
  grossPay: number;

  bpjsKesEmployee: number;
  bpjsJhtEmployee: number;
  bpjsJpEmployee: number;
  bpjsKesEmployer: number;
  bpjsJhtEmployer: number;
  bpjsJpEmployer: number;
  bpjsJkkEmployer: number;
  bpjsJkmEmployer: number;

  otherDeduction: number;
  loanDeduction: number;
  unpaidLeaveCut: number;
  lateCut: number;

  taxableIncome: number;
  terRate: number;
  pph21: number;
  taxMethod: 'TER' | 'PROGRESSIVE';

  totalDeduction: number;
  netPay: number;
  employerCost: number;
  breakdown: BreakdownRow[];
}

/**
 * Upah lembur — Kepmenaker 102/2004, pola 5 hari kerja.
 * Upah sejam = 1/173 × upah sebulan.
 *  · Hari kerja  : jam ke-1 ×1,5 ; jam berikutnya ×2
 *  · Hari libur  : jam 1–8 ×2 ; jam ke-9 ×3 ; jam ke-10+ ×4
 */
export function overtimePay(
  monthlyWage: number,
  weekdayHours: number,
  holidayHours: number,
): { amount: number; detail: string[] } {
  const hourly = monthlyWage / 173;
  const detail: string[] = [];
  let total = 0;

  if (weekdayHours > 0) {
    const first = Math.min(1, weekdayHours);
    const rest = Math.max(0, weekdayHours - 1);
    total += hourly * first * 1.5 + hourly * rest * 2;
    detail.push(`Hari kerja: ${first}j ×1,5 + ${rest.toFixed(1)}j ×2`);
  }

  if (holidayHours > 0) {
    const h1 = Math.min(8, holidayHours);
    const h2 = Math.min(1, Math.max(0, holidayHours - 8));
    const h3 = Math.max(0, holidayHours - 9);
    total += hourly * h1 * 2 + hourly * h2 * 3 + hourly * h3 * 4;
    detail.push(`Hari libur: ${h1}j ×2 + ${h2}j ×3 + ${h3.toFixed(1)}j ×4`);
  }

  return { amount: Math.round(total), detail };
}

/** Iuran BPJS. Upah dasar dibatasi plafon masing-masing program. */
export function calcBpjs(baseWage: number, enrollKes: boolean, enrollTk: boolean, c: BpjsConfig) {
  const kesBase = enrollKes ? Math.min(baseWage, c.kesCap) : 0;
  const jpBase = enrollTk ? Math.min(baseWage, c.jpCap) : 0;
  const tkBase = enrollTk ? baseWage : 0; // JHT/JKK/JKM tanpa plafon

  const pct = (base: number, rate: number) => Math.round((base * rate) / 100);

  return {
    kesEmployee: pct(kesBase, c.kesEmployeeRate),
    kesEmployer: pct(kesBase, c.kesEmployerRate),
    jhtEmployee: pct(tkBase, c.jhtEmployeeRate),
    jhtEmployer: pct(tkBase, c.jhtEmployerRate),
    jpEmployee: pct(jpBase, c.jpEmployeeRate),
    jpEmployer: pct(jpBase, c.jpEmployerRate),
    jkkEmployer: pct(tkBase, c.jkkRate),
    jkmEmployer: pct(tkBase, c.jkmRate),
  };
}

export function calculatePayroll(input: PayrollInput): PayrollResult {
  const rows: BreakdownRow[] = [];

  // ── 1. Gaji pokok, dipotong proporsional bila mangkir tanpa keterangan ──
  const workingDays = Math.max(1, input.workingDays);
  const perDay = Math.round(input.baseSalary / workingDays);

  const unpaidDays = input.unpaidLeaveDays + (input.cutAbsent ? input.absentDays : 0);
  const unpaidLeaveCut = Math.min(input.baseSalary, perDay * unpaidDays);
  const paidBase = input.baseSalary;

  rows.push({ group: 'EARNING', label: 'Gaji pokok', amount: paidBase });

  // ── 2. Tunjangan ──
  let allowanceTaxable = 0;
  let allowanceNonTax = 0;
  let otherDeduction = 0;

  for (const c of input.components) {
    if (c.type === 'ALLOWANCE') {
      if (c.taxable) allowanceTaxable += c.amount;
      else allowanceNonTax += c.amount;
      rows.push({
        group: 'EARNING',
        label: c.name,
        amount: c.amount,
        note: c.taxable ? undefined : 'non-taxable',
      });
    } else {
      otherDeduction += c.amount;
      rows.push({ group: 'DEDUCTION', label: c.name, amount: c.amount });
    }
  }

  // ── 3. Lembur ──
  const ot = overtimePay(
    input.baseSalary + allowanceTaxable,
    input.overtimeHours,
    input.overtimeHolidayHours,
  );
  if (ot.amount > 0) {
    rows.push({
      group: 'EARNING',
      label: 'Upah lembur',
      amount: ot.amount,
      note: ot.detail.join(' · '),
    });
  }

  // ── 4. Bruto ──
  const grossPay = paidBase + allowanceTaxable + allowanceNonTax + ot.amount;

  // ── 5. BPJS (dasar: gaji pokok + tunjangan tetap kena pajak) ──
  const bpjsBase = paidBase + allowanceTaxable;
  const b = calcBpjs(bpjsBase, input.enrollBpjsKes, input.enrollBpjsTk, input.bpjs);

  if (b.kesEmployee) rows.push({ group: 'DEDUCTION', label: 'BPJS Kesehatan (1%)', amount: b.kesEmployee });
  if (b.jhtEmployee) rows.push({ group: 'DEDUCTION', label: 'BPJS JHT (2%)', amount: b.jhtEmployee });
  if (b.jpEmployee) rows.push({ group: 'DEDUCTION', label: 'BPJS Jaminan Pensiun (1%)', amount: b.jpEmployee });

  // ── 6. Potongan lain ──
  const lateCut = Math.round(input.lateMinutes * input.lateCutPerMinute);
  if (unpaidLeaveCut > 0) {
    rows.push({
      group: 'DEDUCTION',
      label: 'Potongan tidak masuk',
      amount: unpaidLeaveCut,
      note: `${unpaidDays} hari × ${perDay.toLocaleString('id-ID')}`,
    });
  }
  if (lateCut > 0) {
    rows.push({
      group: 'DEDUCTION',
      label: 'Potongan keterlambatan',
      amount: lateCut,
      note: `${input.lateMinutes} menit`,
    });
  }
  if (input.loanDeduction > 0) {
    rows.push({ group: 'DEDUCTION', label: 'Cicilan pinjaman', amount: input.loanDeduction });
  }

  // ── 7. PPh 21 ──
  const bpjsEmployeeTotal = b.kesEmployee + b.jhtEmployee + b.jpEmployee;
  // Premi BPJS yang dibayar perusahaan (kesehatan, JKK, JKM) adalah
  // penambah penghasilan bruto karyawan menurut ketentuan PPh 21.
  const taxableGross =
    paidBase + allowanceTaxable + ot.amount - unpaidLeaveCut + b.kesEmployer + b.jkkEmployer + b.jkmEmployer;

  const tax =
    input.isDecember && input.ytdGross !== undefined
      ? pph21Progressive(
          input.ytdGross + taxableGross,
          input.ptkpStatus,
          input.hasNpwp,
          input.ytdTax ?? 0,
          (input.ytdBpjsEmployee ?? 0) + bpjsEmployeeTotal,
        )
      : pph21Ter(Math.max(0, taxableGross), input.ptkpStatus, input.hasNpwp);

  if (tax.tax > 0) {
    rows.push({
      group: 'DEDUCTION',
      label: `PPh 21 (${tax.method === 'TER' ? `TER ${tax.rate}%` : 'progresif Desember'})`,
      amount: tax.tax,
    });
  }

  // ── 8. Sisi perusahaan ──
  const employerBpjs =
    b.kesEmployer + b.jhtEmployer + b.jpEmployer + b.jkkEmployer + b.jkmEmployer;
  rows.push({ group: 'EMPLOYER', label: 'BPJS Kesehatan (4%)', amount: b.kesEmployer });
  rows.push({ group: 'EMPLOYER', label: 'BPJS JHT (3,7%)', amount: b.jhtEmployer });
  rows.push({ group: 'EMPLOYER', label: 'BPJS JP (2%)', amount: b.jpEmployer });
  rows.push({ group: 'EMPLOYER', label: 'BPJS JKK', amount: b.jkkEmployer });
  rows.push({ group: 'EMPLOYER', label: 'BPJS JKM', amount: b.jkmEmployer });

  // ── 9. Total ──
  const totalDeduction =
    bpjsEmployeeTotal + otherDeduction + input.loanDeduction + unpaidLeaveCut + lateCut + tax.tax;
  const netPay = Math.max(0, grossPay - totalDeduction);
  const employerCost = grossPay + employerBpjs;

  return {
    baseSalary: paidBase,
    allowanceTaxable,
    allowanceNonTax,
    overtimePay: ot.amount,
    grossPay,
    bpjsKesEmployee: b.kesEmployee,
    bpjsJhtEmployee: b.jhtEmployee,
    bpjsJpEmployee: b.jpEmployee,
    bpjsKesEmployer: b.kesEmployer,
    bpjsJhtEmployer: b.jhtEmployer,
    bpjsJpEmployer: b.jpEmployer,
    bpjsJkkEmployer: b.jkkEmployer,
    bpjsJkmEmployer: b.jkmEmployer,
    otherDeduction,
    loanDeduction: input.loanDeduction,
    unpaidLeaveCut,
    lateCut,
    taxableIncome: taxableGross,
    terRate: tax.rate,
    pph21: tax.tax,
    taxMethod: tax.method,
    totalDeduction,
    netPay,
    employerCost,
    breakdown: rows,
  };
}

/** Jumlah hari kerja (Sen–Jum) dalam satu periode "YYYY-MM". */
export function workingDaysInPeriod(period: string): number {
  const [y, m] = period.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  let count = 0;
  for (let d = 1; d <= days; d++) {
    const dow = new Date(y, m - 1, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}
