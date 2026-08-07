/**
 * Penyelesai nilai komponen gaji.
 *
 * Satu komponen bisa bernilai tetap, persentase gaji pokok, atau hasil rumus
 * yang diracik HR. Ketiganya diselesaikan di sini supaya proses gaji, simulasi
 * di halaman karyawan, dan skrip seed tidak pernah memakai aturan berbeda.
 */

import { evalFormula, buildVariables, FormulaError, type Variables } from './formula';
import type { ComponentLine } from './payroll-engine';

export interface RawComponent {
  code: string;
  name: string;
  type: string;
  calcType: string;
  amount: number;
  percent: number;
  formula: string | null;
  taxable: boolean;
  countsForBpjs: boolean;
  prorate: boolean;
  active: boolean;
  sortOrder: number;
  scopeDepartments: string | null;
  scopeLevels: string | null;
  note: string | null;
}

export interface KonteksKaryawan {
  departmentId: string | null;
  level: string | null;
  baseSalary: number;
  variables: Variables;
}

function parseScope(json: string | null): string[] | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) && v.length > 0 ? v.map(String) : null;
  } catch {
    return null;
  }
}

/**
 * Apakah komponen ini berlaku untuk karyawan tersebut?
 * Cakupan kosong berarti berlaku untuk semua — inilah yang memungkinkan HR
 * membuat aturan berbeda per divisi tanpa menduplikasi seluruh komponen.
 */
export function berlakuUntuk(c: RawComponent, ctx: KonteksKaryawan): boolean {
  const dept = parseScope(c.scopeDepartments);
  if (dept && (!ctx.departmentId || !dept.includes(ctx.departmentId))) return false;

  const level = parseScope(c.scopeLevels);
  if (level && (!ctx.level || !level.includes(ctx.level))) return false;

  return true;
}

export interface HasilKomponen {
  line: ComponentLine;
  /** terisi bila rumusnya gagal — komponen dilewati, bukan membatalkan payroll */
  error?: string;
}

/** Menghitung satu komponen menjadi baris siap pakai bagi mesin gaji. */
export function resolveComponent(
  c: RawComponent,
  ctx: KonteksKaryawan,
  overrideAmount?: number | null,
): HasilKomponen {
  const dasar: ComponentLine = {
    code: c.code,
    name: c.name,
    type: c.type === 'DEDUCTION' ? 'DEDUCTION' : 'ALLOWANCE',
    amount: 0,
    taxable: c.taxable,
    countsForBpjs: c.countsForBpjs,
    prorate: c.prorate,
  };

  // Nilai yang ditimpa per karyawan selalu menang atas cara hitung apa pun.
  if (overrideAmount !== undefined && overrideAmount !== null) {
    return { line: { ...dasar, amount: overrideAmount, note: 'nilai khusus karyawan' } };
  }

  if (c.calcType === 'PERCENT_OF_BASE') {
    return {
      line: { ...dasar, amount: Math.round((ctx.baseSalary * c.percent) / 100), note: `${c.percent}% gaji pokok` },
    };
  }

  if (c.calcType === 'FORMULA') {
    if (!c.formula) return { line: dasar, error: 'Rumus belum diisi' };
    try {
      const { nilai } = evalFormula(c.formula, ctx.variables);
      // Komponen tidak boleh bernilai negatif; itu akan membalik arah
      // penerimaan menjadi potongan tanpa disadari HR.
      return { line: { ...dasar, amount: Math.max(0, nilai), note: c.formula } };
    } catch (e) {
      const pesan = e instanceof FormulaError ? e.message : 'Rumus gagal dihitung';
      return { line: { ...dasar, amount: 0 }, error: pesan };
    }
  }

  return { line: { ...dasar, amount: c.amount } };
}

/** Menyelesaikan seluruh komponen yang melekat pada seorang karyawan. */
export function resolveAll(
  assignments: { component: RawComponent; overrideAmount: number | null }[],
  ctx: KonteksKaryawan,
): { lines: ComponentLine[]; errors: { code: string; pesan: string }[] } {
  const lines: ComponentLine[] = [];
  const errors: { code: string; pesan: string }[] = [];

  const urut = [...assignments].sort((a, b) => a.component.sortOrder - b.component.sortOrder);

  for (const a of urut) {
    if (!a.component.active) continue;
    if (!berlakuUntuk(a.component, ctx)) continue;

    const { line, error } = resolveComponent(a.component, ctx, a.overrideAmount);
    if (error) errors.push({ code: a.component.code, pesan: error });
    if (line.amount !== 0) lines.push(line);
  }

  return { lines, errors };
}

export { buildVariables };
