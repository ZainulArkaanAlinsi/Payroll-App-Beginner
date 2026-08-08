/**
 * Mesin penggajian Racik.
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
import {
  hitungPotonganTelat,
  hitungUpahLembur,
  LATE_DEFAULT,
  OVERTIME_DEFAULT,
  type LateConfig,
  type OvertimeConfig,
} from './policy';

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
  /** nominal yang sudah diselesaikan — rumus dievaluasi sebelum masuk mesin */
  amount: number;
  taxable: boolean;
  /** ikut menambah dasar pengali BPJS */
  countsForBpjs?: boolean;
  /** dipotong proporsional bila karyawan tidak bekerja sebulan penuh */
  prorate?: boolean;
  /**
   * Tunjangan tetap — nilainya tidak bergantung kehadiran.
   *
   * Dipakai sebagai dasar upah lembur menurut PP 36/2021 jo. Kepmenaker
   * 102/2004: "upah sebulan" berarti gaji pokok ditambah tunjangan tetap.
   * Komponen berumus dikecualikan karena nilainya baru diketahui setelah
   * periode berakhir, sedangkan lembur disetujui jauh sebelum itu — dan angka
   * yang disebut saat menyetujui harus sama dengan yang dibayarkan.
   */
  tetap?: boolean;
  /** penjelasan asal angka, ditampilkan di slip */
  note?: string;
}

export type TaxMethod = 'NETT' | 'GROSS' | 'GROSS_UP';

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
  /**
   * Nilai rupiah lembur yang sudah dikunci saat persetujuan.
   *
   * Bila diisi, dipakai apa adanya dan jam lembur hanya menjadi keterangan.
   * Ini yang membuat angka pada slip sama dengan angka yang disebutkan kepada
   * karyawan waktu lemburnya disetujui — termasuk bila gajinya naik di tengah
   * periode, yang seharusnya tidak mengubah lembur yang sudah lampau.
   *
   * Dikosongkan hanya untuk simulasi, ketika belum ada persetujuan apa pun.
   */
  overtimeLocked?: number | null;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  unpaidLeaveDays: number;
  lateMinutes: number;
  loanDeduction: number;
  workingDays: number;
  cutAbsent: boolean;
  /** aturan keterlambatan yang berlaku bagi karyawan ini */
  latePolicy?: LateConfig;
  /** aturan lembur yang berlaku bagi karyawan ini */
  overtimePolicy?: OvertimeConfig;
  bpjs: BpjsConfig;
  isDecember?: boolean;
  ytdGross?: number;
  ytdTax?: number;
  ytdBpjsEmployee?: number;

  /** siapa yang menanggung PPh 21 */
  taxMethod?: TaxMethod;
  /**
   * Hari yang benar-benar dibayar dalam periode ini. Lebih kecil dari
   * workingDays bila karyawan masuk atau berhenti di tengah bulan.
   * Bila tidak diisi, dianggap bekerja sebulan penuh.
   */
  paidDays?: number;
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
  /** tunjangan pajak bila perusahaan yang menanggung */
  taxAllowance: number;
  /** hari dibayar bila prorata berlaku; 0 berarti sebulan penuh */
  prorateDays: number;
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
/**
 * Upah sebulan yang dipakai sebagai dasar perhitungan lembur.
 *
 * Kepmenaker 102/2004 memakai istilah "upah sebulan", dan PP 36/2021 Pasal 7
 * menjelaskannya sebagai upah pokok ditambah tunjangan tetap. Diletakkan
 * sebagai fungsi tersendiri karena dipakai tiga jalur yang harus sepakat:
 * mesin gaji, persetujuan lembur oleh HR, dan pratinjau yang dilihat karyawan
 * sebelum mengajukan. Sebelumnya ketiganya menghitung sendiri-sendiri, dan
 * angka yang disebut saat menyetujui tidak sama dengan yang dibayarkan.
 */
export function upahDasarLembur(gajiPokok: number, tunjanganTetap: number): number {
  return gajiPokok + tunjanganTetap;
}

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

  // ── 1. Gaji pokok, diprorata bila tidak bekerja sebulan penuh ──
  const workingDays = Math.max(1, input.workingDays);
  const paidDays = Math.min(workingDays, Math.max(0, input.paidDays ?? workingDays));
  const prorated = paidDays < workingDays;
  // faktor prorata dipakai bersama oleh gaji pokok dan komponen ber-prorata
  const factor = prorated ? paidDays / workingDays : 1;

  const perDay = Math.round(input.baseSalary / workingDays);
  const paidBase = prorated ? Math.round(input.baseSalary * factor) : input.baseSalary;

  const unpaidDays = input.unpaidLeaveDays + (input.cutAbsent ? input.absentDays : 0);
  const unpaidLeaveCut = Math.min(paidBase, perDay * unpaidDays);

  rows.push({
    group: 'EARNING',
    label: 'Gaji pokok',
    amount: paidBase,
    note: prorated ? `prorata ${paidDays}/${workingDays} hari kerja` : undefined,
  });

  // ── 2. Tunjangan & potongan komponen ──
  let allowanceTaxable = 0;
  // hanya tunjangan tetap yang menjadi dasar upah lembur
  let allowanceTetap = 0;
  let allowanceNonTax = 0;
  let otherDeduction = 0;
  // sebagian komponen ikut menaikkan dasar pengali BPJS
  let bpjsExtra = 0;

  for (const c of input.components) {
    const amount = c.prorate ? Math.round(c.amount * factor) : c.amount;
    if (amount === 0) continue;

    const note = [c.note, c.prorate && prorated ? `prorata ${paidDays}/${workingDays}` : null]
      .filter(Boolean)
      .join(' · ');

    if (c.type === 'ALLOWANCE') {
      if (c.taxable) allowanceTaxable += amount;
      else allowanceNonTax += amount;
      if (c.tetap) allowanceTetap += amount;
      if (c.countsForBpjs) bpjsExtra += amount;
      rows.push({
        group: 'EARNING',
        label: c.name,
        amount,
        note: note || (c.taxable ? undefined : 'bebas pajak'),
      });
    } else {
      otherDeduction += amount;
      rows.push({ group: 'DEDUCTION', label: c.name, amount, note: note || undefined });
    }
  }

  // ── 3. Lembur ──
  // Nilai yang sudah dikunci saat persetujuan menang atas perhitungan ulang.
  // Menghitung ulang di sini berarti nilainya bisa berubah setelah disetujui,
  // dan penguncian saat persetujuan menjadi tidak ada artinya.
  const jamTotal = input.overtimeHours + input.overtimeHolidayHours;
  const ot =
    input.overtimeLocked != null
      ? {
          amount: input.overtimeLocked,
          detail: [`${jamTotal} jam, nilai dikunci saat persetujuan`],
        }
      : hitungUpahLembur(
          upahDasarLembur(input.baseSalary, allowanceTetap),
          input.overtimeHours,
          input.overtimeHolidayHours,
          input.overtimePolicy ?? OVERTIME_DEFAULT,
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
  // Tunjangan pajak (bila ada) ditambahkan setelah bagian pajak, karena
  // nilainya baru diketahui di sana.
  let grossPay = paidBase + allowanceTaxable + allowanceNonTax + ot.amount;

  // ── 5. BPJS ──
  // Dasarnya gaji pokok ditambah komponen yang ditandai HR sebagai dasar
  // pengali BPJS — bukan otomatis seluruh tunjangan kena pajak, karena
  // perusahaan berbeda menetapkan "upah" yang berbeda untuk BPJS.
  const bpjsBase = paidBase + bpjsExtra;
  const b = calcBpjs(bpjsBase, input.enrollBpjsKes, input.enrollBpjsTk, input.bpjs);

  if (b.kesEmployee) rows.push({ group: 'DEDUCTION', label: 'BPJS Kesehatan (1%)', amount: b.kesEmployee });
  if (b.jhtEmployee) rows.push({ group: 'DEDUCTION', label: 'BPJS JHT (2%)', amount: b.jhtEmployee });
  if (b.jpEmployee) rows.push({ group: 'DEDUCTION', label: 'BPJS Jaminan Pensiun (1%)', amount: b.jpEmployee });

  // ── 6. Potongan lain ──
  const lateCut = hitungPotonganTelat(input.lateMinutes, input.latePolicy ?? LATE_DEFAULT);
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
      note: `${input.lateMinutes} menit, toleransi ${(input.latePolicy ?? LATE_DEFAULT).toleransiMenit} menit`,
    });
  }
  if (input.loanDeduction > 0) {
    rows.push({ group: 'DEDUCTION', label: 'Cicilan pinjaman', amount: input.loanDeduction });
  }

  // ── 7. PPh 21 ──
  const bpjsEmployeeTotal = b.kesEmployee + b.jhtEmployee + b.jpEmployee;
  // Premi BPJS yang dibayar perusahaan (kesehatan, JKK, JKM) adalah
  // penambah penghasilan bruto karyawan menurut ketentuan PPh 21.
  const dasarPajak =
    paidBase + allowanceTaxable + ot.amount - unpaidLeaveCut + b.kesEmployer + b.jkkEmployer + b.jkmEmployer;

  const hitungPajak = (tambahan: number) =>
    input.isDecember && input.ytdGross !== undefined
      ? pph21Progressive(
          input.ytdGross + dasarPajak + tambahan,
          input.ptkpStatus,
          input.hasNpwp,
          input.ytdTax ?? 0,
          (input.ytdBpjsEmployee ?? 0) + bpjsEmployeeTotal,
        )
      : pph21Ter(Math.max(0, dasarPajak + tambahan), input.ptkpStatus, input.hasNpwp);

  const metode: TaxMethod = input.taxMethod ?? 'NETT';
  let taxAllowance = 0;

  if (metode === 'GROSS') {
    // Perusahaan memberi tunjangan pajak sebesar pajak atas penghasilan
    // sebelum tunjangan itu. Tunjangannya sendiri tetap kena pajak, jadi
    // karyawan masih menanggung selisih kecil — itu memang sifat metode ini.
    taxAllowance = hitungPajak(0).tax;
  } else if (metode === 'GROSS_UP') {
    // Cari titik tetap: tunjangan = pajak atas (penghasilan + tunjangan).
    // Karena tarif TER berjenjang, iterasi jauh lebih sederhana dan lebih
    // akurat daripada rumus tertutup. Konvergen dalam beberapa putaran.
    let x = hitungPajak(0).tax;
    for (let i = 0; i < 12; i++) {
      const next = hitungPajak(x).tax;
      if (Math.abs(next - x) <= 1) {
        x = next;
        break;
      }
      x = next;
    }
    taxAllowance = x;
  }

  const tax = hitungPajak(taxAllowance);

  if (taxAllowance > 0) {
    allowanceTaxable += taxAllowance;
    rows.push({
      group: 'EARNING',
      label: 'Tunjangan pajak',
      amount: taxAllowance,
      note: metode === 'GROSS_UP' ? 'metode gross up' : 'metode gross',
    });
  }

  grossPay += taxAllowance;

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
    taxableIncome: dasarPajak + taxAllowance,
    taxAllowance,
    prorateDays: prorated ? paidDays : 0,
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
