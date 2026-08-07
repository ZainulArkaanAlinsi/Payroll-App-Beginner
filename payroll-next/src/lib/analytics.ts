import 'server-only';
import { prisma } from './prisma';
import { labelPeriode, periodeSekarang } from './format';

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
    { label: 'PPh 21', value: s.pph21 ?? 0 },
    { label: 'BPJS JHT', value: s.bpjsJhtEmployee ?? 0 },
    { label: 'BPJS Kesehatan', value: s.bpjsKesEmployee ?? 0 },
    { label: 'BPJS Jaminan Pensiun', value: s.bpjsJpEmployee ?? 0 },
    { label: 'Potongan lain', value: (s.otherDeduction ?? 0) + (s.lateCut ?? 0) + (s.unpaidLeaveCut ?? 0) },
    { label: 'Cicilan pinjaman', value: s.loanDeduction ?? 0 },
  ].filter((x) => x.value > 0);
}
