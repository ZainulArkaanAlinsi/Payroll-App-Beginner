import 'server-only';
import { prisma } from './prisma';
import { labelPeriode, periodeSekarang, rupiahRingkas } from './format';

/** Ringkasan yang dipakai dasbor & laporan. Satu tempat agar angkanya konsisten. */
export async function companyOverview() {
  const runs = await prisma.payrollRun.findMany({
    where: { status: { in: ['APPROVED', 'PAID'] } },
    orderBy: { period: 'asc' },
    take: 12,
  });

  const latest = runs[runs.length - 1] ?? null;
  const previous = runs[runs.length - 2] ?? null;

  const [headcount, activeSalary, departments] = await Promise.all([
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
    prisma.employee.aggregate({ where: { status: 'ACTIVE' }, _avg: { baseSalary: true }, _sum: { baseSalary: true } }),
    prisma.department.findMany({ orderBy: { code: 'asc' }, select: { id: true, name: true, code: true } }),
  ]);

  // kehadiran bulan berjalan
  const period = periodeSekarang();
  const [y, m] = period.split('-').map(Number);
  const attendance = await prisma.attendance.groupBy({
    by: ['status'],
    where: { date: { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) } },
    _count: true,
  });
  const attTotal = attendance.reduce((s, a) => s + a._count, 0);
  const attPresent = attendance
    .filter((a) => ['PRESENT', 'LATE', 'WFH'].includes(a.status))
    .reduce((s, a) => s + a._count, 0);

  const [pendingLeave, pendingOvertime] = await Promise.all([
    prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
    prisma.overtime.count({ where: { status: 'PENDING' } }),
  ]);

  return {
    runs,
    latest,
    previous,
    headcount,
    avgSalary: Math.round(activeSalary._avg.baseSalary ?? 0),
    totalBaseSalary: activeSalary._sum.baseSalary ?? 0,
    departments,
    attendanceRate: attTotal > 0 ? (attPresent / attTotal) * 100 : 0,
    attendanceDays: attTotal,
    pendingLeave,
    pendingOvertime,
    trend: runs.slice(-6).map((r) => ({ label: labelPeriode(r.period).slice(0, 3), value: r.totalNet })),
  };
}

/** Biaya perusahaan per departemen untuk satu proses gaji. */
export async function costByDepartment(runId: string) {
  const items = await prisma.payrollItem.findMany({
    where: { runId },
    select: {
      employerCost: true,
      netPay: true,
      employee: { select: { department: { select: { id: true, name: true, code: true } } } },
    },
  });

  const map = new Map<string, { name: string; code: string; cost: number; net: number; count: number }>();
  for (const it of items) {
    const d = it.employee.department;
    const key = d?.id ?? 'none';
    const row = map.get(key) ?? {
      name: d?.name ?? 'Tanpa departemen',
      code: d?.code ?? '—',
      cost: 0,
      net: 0,
      count: 0,
    };
    row.cost += it.employerCost;
    row.net += it.netPay;
    row.count += 1;
    map.set(key, row);
  }
  return [...map.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.cost - a.cost);
}

/** Matriks departemen × periode untuk visualisasi 3D. */
export async function costTerrain(limitPeriods = 4) {
  const runs = await prisma.payrollRun.findMany({
    where: { status: { in: ['APPROVED', 'PAID'] } },
    orderBy: { period: 'desc' },
    take: limitPeriods,
    select: { id: true, period: true },
  });
  runs.reverse();

  const departments = await prisma.department.findMany({
    orderBy: { code: 'asc' },
    select: { id: true, name: true, code: true },
  });

  const items = await prisma.payrollItem.findMany({
    where: { runId: { in: runs.map((r) => r.id) } },
    select: { runId: true, employerCost: true, employee: { select: { departmentId: true } } },
  });

  const key = (r: string, d: string) => `${r}|${d}`;
  const sums = new Map<string, number>();
  for (const it of items) {
    const k = key(it.runId, it.employee.departmentId ?? 'none');
    sums.set(k, (sums.get(k) ?? 0) + it.employerCost);
  }

  const cells = [];
  for (let di = 0; di < departments.length; di++) {
    for (let pi = 0; pi < runs.length; pi++) {
      cells.push({
        dept: departments[di].name,
        period: labelPeriode(runs[pi].period),
        value: sums.get(key(runs[pi].id, departments[di].id)) ?? 0,
        deptIndex: di,
        periodIndex: pi,
      });
    }
  }

  return {
    cells,
    departments: departments.map((d) => d.name),
    periods: runs.map((r) => labelPeriode(r.period)),
  };
}

/**
 * Perbandingan biaya per departemen antara dua periode.
 *
 * Angka mutlak saja tidak cukup untuk mengambil keputusan — yang dicari
 * manajemen biasanya "naiknya dari mana", jadi selisih terhadap periode
 * sebelumnya dihitung berdampingan.
 */
export async function departmentComparison(runId: string, prevRunId?: string | null) {
  const [sekarang, sebelum] = await Promise.all([
    costByDepartment(runId),
    prevRunId ? costByDepartment(prevRunId) : Promise.resolve([]),
  ]);

  const petaLalu = new Map(sebelum.map((d) => [d.id, d]));
  const total = sekarang.reduce((s, d) => s + d.cost, 0) || 1;

  return sekarang.map((d) => {
    const lalu = petaLalu.get(d.id);
    const delta = lalu && lalu.cost > 0 ? ((d.cost - lalu.cost) / lalu.cost) * 100 : null;
    return {
      ...d,
      pangsa: (d.cost / total) * 100,
      perKaryawan: d.count > 0 ? Math.round(d.cost / d.count) : 0,
      costLalu: lalu?.cost ?? null,
      delta,
      selisih: lalu ? d.cost - lalu.cost : null,
    };
  });
}

export interface Sorotan {
  nada: 'jade' | 'brass' | 'clay' | 'info';
  teks: string;
}

/**
 * Ringkasan yang ditulis dari angkanya sendiri.
 * Tujuannya menghemat langkah pertama pembaca laporan: menemukan
 * apa yang berubah, sebelum menelusuri tabelnya.
 */
export function susunSorotan(input: {
  periode: string;
  totalEmployerCost: number;
  totalNet: number;
  totalTax: number;
  headcount: number;
  prevCost: number | null;
  departemen: { name: string; delta: number | null; selisih: number | null; pangsa: number }[];
  tanpaNpwp: number;
}): Sorotan[] {
  const out: Sorotan[] = [];

  if (input.prevCost && input.prevCost > 0) {
    const d = ((input.totalEmployerCost - input.prevCost) / input.prevCost) * 100;
    const naik = d >= 0;
    out.push({
      nada: Math.abs(d) < 1 ? 'info' : naik ? 'brass' : 'jade',
      teks:
        Math.abs(d) < 1
          ? `Biaya tenaga kerja praktis datar dibanding periode lalu (${d >= 0 ? '+' : ''}${d.toFixed(1)}%).`
          : `Biaya tenaga kerja ${naik ? 'naik' : 'turun'} ${Math.abs(d).toFixed(1)}% dibanding periode lalu.`,
    });
  }

  // penyumbang kenaikan terbesar
  const penggerak = [...input.departemen]
    .filter((d) => d.selisih !== null)
    .sort((a, b) => Math.abs(b.selisih!) - Math.abs(a.selisih!))[0];
  if (penggerak && penggerak.selisih && Math.abs(penggerak.selisih) > 0) {
    out.push({
      nada: penggerak.selisih > 0 ? 'brass' : 'jade',
      teks: `Perubahan terbesar dari ${penggerak.name}: ${penggerak.selisih > 0 ? 'bertambah' : 'berkurang'} ${rupiahRingkas(Math.abs(penggerak.selisih))}.`,
    });
  }

  const terbesar = [...input.departemen].sort((a, b) => b.pangsa - a.pangsa)[0];
  if (terbesar) {
    out.push({
      nada: 'info',
      teks: `${terbesar.name} menyerap ${terbesar.pangsa.toFixed(0)}% dari seluruh biaya tenaga kerja.`,
    });
  }

  const rasioPajak = input.totalEmployerCost > 0 ? (input.totalTax / input.totalEmployerCost) * 100 : 0;
  out.push({
    nada: 'info',
    teks: `${rasioPajak.toFixed(1)}% dari biaya tenaga kerja disetor sebagai PPh 21.`,
  });

  if (input.tanpaNpwp > 0) {
    out.push({
      nada: 'clay',
      teks: `${input.tanpaNpwp} karyawan belum punya NPWP dan membayar pajak 20% lebih tinggi dari seharusnya.`,
    });
  }

  return out;
}

/** Komposisi potongan pada satu proses gaji. */
export async function deductionBreakdown(runId: string) {
  const a = await prisma.payrollItem.aggregate({
    where: { runId },
    _sum: {
      pph21: true,
      bpjsKesEmployee: true,
      bpjsJhtEmployee: true,
      bpjsJpEmployee: true,
      otherDeduction: true,
      loanDeduction: true,
      unpaidLeaveCut: true,
      lateCut: true,
    },
  });
  const s = a._sum;
  return [
    // Label dijaga pendek: legenda donat hidup di kolom sempit, dan nama
    // panjang akan terpotong menjadi "BP…" yang tidak berarti apa-apa.
    { label: 'PPh 21', value: s.pph21 ?? 0 },
    { label: 'BPJS JHT', value: s.bpjsJhtEmployee ?? 0 },
    { label: 'BPJS Kes', value: s.bpjsKesEmployee ?? 0 },
    { label: 'BPJS JP', value: s.bpjsJpEmployee ?? 0 },
    { label: 'Potongan lain', value: (s.otherDeduction ?? 0) + (s.lateCut ?? 0) + (s.unpaidLeaveCut ?? 0) },
    { label: 'Cicilan', value: s.loanDeduction ?? 0 },
  ].filter((x) => x.value > 0);
}
