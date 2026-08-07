/**
 * Aturan kerja yang bisa berbeda antar divisi.
 *
 * Satu perusahaan jarang punya satu kebijakan seragam: bagian operasional
 * biasanya lebih ketat soal jam masuk, direksi dikecualikan, tim teknologi
 * memakai lembur tarif rata. Modul ini memilih aturan mana yang berlaku bagi
 * seorang karyawan, lalu menerjemahkannya menjadi rupiah.
 *
 * Pemilihannya: yang paling spesifik menang. Aturan bertingkat jabatan
 * mengalahkan aturan berdepartemen, dan keduanya mengalahkan aturan umum.
 * Bila spesifisitasnya sama, prioritas tertinggi yang dipakai.
 */

export type PolicyKind = 'LATE' | 'OVERTIME' | 'ABSENCE';

export interface PolicyRow {
  id: string;
  name: string;
  kind: string;
  config: string;
  priority: number;
  active: boolean;
  scopeDepartmentId: string | null;
  scopeLevel: string | null;
}

export interface LateConfig {
  toleransiMenit: number;
  potonganPerMenit: number;
  potonganMaksPerBulan: number;
}

export interface OvertimeConfig {
  metode: 'KEPMENAKER' | 'FLAT';
  pembagi?: number;
  tarifPerJam?: number;
}

export const LATE_DEFAULT: LateConfig = {
  toleransiMenit: 0,
  potonganPerMenit: 0,
  potonganMaksPerBulan: 0,
};

export const OVERTIME_DEFAULT: OvertimeConfig = { metode: 'KEPMENAKER', pembagi: 173 };

/** Semakin besar, semakin spesifik. */
function spesifisitas(r: PolicyRow): number {
  if (r.scopeLevel) return 2;
  if (r.scopeDepartmentId) return 1;
  return 0;
}

/** Aturan yang berlaku untuk seorang karyawan, atau null bila tidak ada. */
export function pilihAturan(
  rules: PolicyRow[],
  kind: PolicyKind,
  departmentId: string | null,
  level: string | null,
): PolicyRow | null {
  const cocok = rules.filter((r) => {
    if (!r.active || r.kind !== kind) return false;
    if (r.scopeDepartmentId && r.scopeDepartmentId !== departmentId) return false;
    if (r.scopeLevel && r.scopeLevel !== level) return false;
    return true;
  });

  if (cocok.length === 0) return null;

  cocok.sort((a, b) => {
    const s = spesifisitas(b) - spesifisitas(a);
    if (s !== 0) return s;
    return b.priority - a.priority;
  });

  return cocok[0];
}

function bacaConfig<T>(raw: string, fallback: T): T {
  try {
    return { ...fallback, ...(JSON.parse(raw) as object) } as T;
  } catch {
    return fallback;
  }
}

export function lateConfigDari(rule: PolicyRow | null): LateConfig {
  return rule ? bacaConfig(rule.config, LATE_DEFAULT) : LATE_DEFAULT;
}

export function overtimeConfigDari(rule: PolicyRow | null): OvertimeConfig {
  return rule ? bacaConfig(rule.config, OVERTIME_DEFAULT) : OVERTIME_DEFAULT;
}

/** Potongan keterlambatan sebulan menurut aturan yang berlaku. */
export function hitungPotonganTelat(menitTelat: number, c: LateConfig): number {
  const kena = Math.max(0, menitTelat - c.toleransiMenit);
  const nilai = kena * c.potonganPerMenit;
  // plafon 0 berarti tanpa batas atas
  return c.potonganMaksPerBulan > 0 ? Math.min(nilai, c.potonganMaksPerBulan) : nilai;
}

/**
 * Upah lembur menurut aturan yang berlaku.
 * KEPMENAKER memakai pengganda resmi; FLAT memakai tarif rata per jam.
 */
export function hitungUpahLembur(
  monthlyWage: number,
  weekdayHours: number,
  holidayHours: number,
  c: OvertimeConfig,
): { amount: number; detail: string[] } {
  if (c.metode === 'FLAT') {
    const tarif = c.tarifPerJam ?? 0;
    const total = (weekdayHours + holidayHours) * tarif;
    return {
      amount: Math.round(total),
      detail: [`Tarif rata ${tarif.toLocaleString('id-ID')}/jam × ${weekdayHours + holidayHours} jam`],
    };
  }

  const hourly = monthlyWage / (c.pembagi && c.pembagi > 0 ? c.pembagi : 173);
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

export const LEVEL_PILIHAN = [
  ['INTERN', 'Magang'],
  ['STAFF', 'Staf'],
  ['SENIOR', 'Senior'],
  ['LEAD', 'Lead'],
  ['MANAGER', 'Manajer'],
  ['DIRECTOR', 'Direktur'],
] as const;
