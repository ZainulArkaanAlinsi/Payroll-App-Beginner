/**
 * Mesin pajak penghasilan orang pribadi — Indonesia.
 *
 * Dua metode yang dipakai perusahaan:
 *  1. TER (Tarif Efektif Rata-rata) — PP 58/2023, dipakai masa pajak Jan–Nov.
 *     Tarif tunggal dikali penghasilan bruto bulanan. Cepat, tanpa setahunan.
 *  2. Progresif Pasal 17 UU HPP — dipakai masa Desember untuk menutup selisih
 *     setahun penuh (PPh terutang setahun dikurangi yang sudah dipotong).
 *
 * Semua nominal dalam rupiah penuh (integer).
 */

export type PtkpStatus = 'TK/0' | 'TK/1' | 'TK/2' | 'TK/3' | 'K/0' | 'K/1' | 'K/2' | 'K/3';

/** PTKP setahun (UU HPP / PMK 101). */
export const PTKP: Record<PtkpStatus, number> = {
  'TK/0': 54_000_000,
  'TK/1': 58_500_000,
  'TK/2': 63_000_000,
  'TK/3': 67_500_000,
  'K/0': 58_500_000,
  'K/1': 63_000_000,
  'K/2': 67_500_000,
  'K/3': 72_000_000,
};

export const PTKP_LABEL: Record<PtkpStatus, string> = {
  'TK/0': 'TK/0 — Lajang, tanpa tanggungan',
  'TK/1': 'TK/1 — Lajang, 1 tanggungan',
  'TK/2': 'TK/2 — Lajang, 2 tanggungan',
  'TK/3': 'TK/3 — Lajang, 3 tanggungan',
  'K/0': 'K/0 — Kawin, tanpa tanggungan',
  'K/1': 'K/1 — Kawin, 1 tanggungan',
  'K/2': 'K/2 — Kawin, 2 tanggungan',
  'K/3': 'K/3 — Kawin, 3 tanggungan',
};

/** Pemetaan status PTKP ke kategori TER bulanan. */
export function terCategory(ptkp: PtkpStatus): 'A' | 'B' | 'C' {
  if (ptkp === 'K/3') return 'C';
  if (ptkp === 'TK/2' || ptkp === 'TK/3' || ptkp === 'K/1' || ptkp === 'K/2') return 'B';
  return 'A'; // TK/0, TK/1, K/0
}

/** [batas atas bruto bulanan, tarif persen]. Baris terakhir = tak terbatas. */
type Bracket = [number, number];

const TER_A: Bracket[] = [
  [5_400_000, 0], [5_650_000, 0.25], [5_950_000, 0.5], [6_300_000, 0.75],
  [6_750_000, 1], [7_500_000, 1.25], [8_550_000, 1.5], [9_650_000, 1.75],
  [10_050_000, 2], [10_350_000, 2.25], [10_700_000, 2.5], [11_050_000, 3],
  [11_600_000, 3.5], [12_500_000, 4], [13_750_000, 5], [15_100_000, 6],
  [16_950_000, 7], [19_750_000, 8], [24_150_000, 9], [26_450_000, 10],
  [28_000_000, 11], [30_050_000, 12], [32_400_000, 13], [35_400_000, 14],
  [39_100_000, 15], [43_850_000, 16], [47_800_000, 17], [51_400_000, 18],
  [56_300_000, 19], [62_200_000, 20], [68_600_000, 21], [77_500_000, 22],
  [89_000_000, 23], [103_000_000, 24], [125_000_000, 25], [157_000_000, 26],
  [206_000_000, 27], [337_000_000, 28], [454_000_000, 29], [550_000_000, 30],
  [695_000_000, 31], [910_000_000, 32], [1_400_000_000, 33], [Infinity, 34],
];

const TER_B: Bracket[] = [
  [6_200_000, 0], [6_500_000, 0.25], [6_850_000, 0.5], [7_300_000, 0.75],
  [7_800_000, 1], [8_850_000, 1.25], [9_800_000, 1.5], [10_950_000, 1.75],
  [11_200_000, 2], [11_450_000, 2.25], [11_600_000, 2.5], [11_750_000, 3],
  [11_850_000, 4], [12_100_000, 5], [12_500_000, 6], [12_950_000, 7],
  [13_950_000, 8], [15_350_000, 9], [16_400_000, 10], [18_450_000, 11],
  [19_950_000, 12], [21_400_000, 13], [26_600_000, 14], [28_800_000, 15],
  [32_400_000, 16], [35_400_000, 17], [39_100_000, 18], [43_850_000, 19],
  [47_800_000, 20], [51_400_000, 21], [56_300_000, 22], [62_200_000, 23],
  [68_600_000, 24], [77_500_000, 25], [89_000_000, 26], [103_000_000, 27],
  [125_000_000, 28], [157_000_000, 29], [206_000_000, 30], [337_000_000, 31],
  [454_000_000, 32], [550_000_000, 33], [Infinity, 34],
];

const TER_C: Bracket[] = [
  [6_600_000, 0], [6_950_000, 0.25], [7_350_000, 0.5], [7_800_000, 0.75],
  [8_850_000, 1], [9_800_000, 1.25], [10_950_000, 1.5], [11_200_000, 1.75],
  [11_450_000, 2], [11_600_000, 2.25], [11_750_000, 2.5], [11_850_000, 3],
  [12_100_000, 4], [12_500_000, 5], [13_300_000, 6], [14_650_000, 7],
  [16_400_000, 8], [18_450_000, 9], [19_950_000, 10], [21_400_000, 11],
  [26_600_000, 12], [28_800_000, 13], [32_400_000, 14], [35_400_000, 15],
  [39_100_000, 16], [43_850_000, 17], [47_800_000, 18], [51_400_000, 19],
  [56_300_000, 20], [62_200_000, 21], [68_600_000, 22], [77_500_000, 23],
  [89_000_000, 24], [103_000_000, 25], [125_000_000, 26], [157_000_000, 27],
  [206_000_000, 28], [337_000_000, 29], [454_000_000, 30], [550_000_000, 31],
  [695_000_000, 32], [910_000_000, 33], [Infinity, 34],
];

const TER_TABLE = { A: TER_A, B: TER_B, C: TER_C } as const;

/** Tarif efektif bulanan (%) untuk penghasilan bruto tertentu. */
export function terRate(ptkp: PtkpStatus, monthlyGross: number): number {
  const table = TER_TABLE[terCategory(ptkp)];
  for (const [ceiling, rate] of table) {
    if (monthlyGross <= ceiling) return rate;
  }
  return 34;
}

/** Lapisan tarif Pasal 17 UU HPP: [batas atas PKP setahun, tarif]. */
const PROGRESSIVE: Bracket[] = [
  [60_000_000, 5],
  [250_000_000, 15],
  [500_000_000, 25],
  [5_000_000_000, 30],
  [Infinity, 35],
];

/** Biaya jabatan: 5% bruto, dibatasi Rp 500.000/bulan (Rp 6.000.000/tahun). */
export function biayaJabatan(gross: number, months = 1): number {
  return Math.min(Math.round(gross * 0.05), 500_000 * months);
}

export interface Pph21Result {
  method: 'TER' | 'PROGRESSIVE';
  rate: number; // persen efektif yang dipakai
  taxableBase: number; // dasar pengenaan
  tax: number; // PPh 21 sebulan
  /** Baris penjelas untuk ditampilkan di slip gaji. */
  trace: { label: string; value: string }[];
}

/**
 * PPh 21 metode TER — masa pajak Januari–November.
 * Dasarnya penghasilan BRUTO (bukan neto), tanpa kurangi biaya jabatan.
 */
export function pph21Ter(
  grossMonthly: number,
  ptkp: PtkpStatus,
  hasNpwp: boolean,
): Pph21Result {
  const cat = terCategory(ptkp);
  const rate = terRate(ptkp, grossMonthly);
  let tax = Math.round((grossMonthly * rate) / 100);

  // Tanpa NPWP dikenakan 20% lebih tinggi (Pasal 21 ayat 5a UU PPh).
  const penalty = hasNpwp ? 0 : Math.round(tax * 0.2);
  tax += penalty;

  const trace = [
    { label: 'Kategori TER', value: `TER ${cat} (${ptkp})` },
    { label: 'Bruto sebulan', value: grossMonthly.toString() },
    { label: 'Tarif efektif', value: `${rate}%` },
  ];
  if (penalty > 0) trace.push({ label: 'Sanksi tanpa NPWP (+20%)', value: penalty.toString() });

  return { method: 'TER', rate, taxableBase: grossMonthly, tax, trace };
}

/**
 * PPh 21 metode progresif setahun — dipakai masa Desember.
 * Menghitung pajak terutang setahun lalu dikurangi yang sudah dipotong Jan–Nov.
 */
export function pph21Progressive(
  annualGross: number,
  ptkp: PtkpStatus,
  hasNpwp: boolean,
  alreadyWithheld = 0,
  annualBpjsEmployee = 0,
): Pph21Result {
  const bj = biayaJabatan(annualGross, 12);
  const netAnnual = Math.max(0, annualGross - bj - annualBpjsEmployee);
  // PKP dibulatkan ke bawah ribuan penuh.
  const pkp = Math.max(0, Math.floor((netAnnual - PTKP[ptkp]) / 1000) * 1000);

  let remaining = pkp;
  let lower = 0;
  let annualTax = 0;
  const layers: { label: string; value: string }[] = [];

  for (const [ceiling, rate] of PROGRESSIVE) {
    if (remaining <= 0) break;
    const slice = Math.min(remaining, ceiling - lower);
    const layerTax = Math.round((slice * rate) / 100);
    annualTax += layerTax;
    layers.push({ label: `Lapisan ${rate}%`, value: layerTax.toString() });
    remaining -= slice;
    lower = ceiling;
  }

  if (!hasNpwp) annualTax = Math.round(annualTax * 1.2);

  const tax = Math.max(0, annualTax - alreadyWithheld);
  const effective = annualGross > 0 ? +((annualTax / annualGross) * 100).toFixed(2) : 0;

  return {
    method: 'PROGRESSIVE',
    rate: effective,
    taxableBase: pkp,
    tax,
    trace: [
      { label: 'Bruto setahun', value: annualGross.toString() },
      { label: 'Biaya jabatan', value: bj.toString() },
      { label: 'Iuran BPJS karyawan', value: annualBpjsEmployee.toString() },
      { label: `PTKP ${ptkp}`, value: PTKP[ptkp].toString() },
      { label: 'PKP setahun', value: pkp.toString() },
      ...layers,
      { label: 'Sudah dipotong Jan–Nov', value: alreadyWithheld.toString() },
    ],
  };
}
