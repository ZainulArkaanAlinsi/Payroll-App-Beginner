'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { audit, notify, requireRole } from '@/lib/auth';
import { FAIL, OK, type ActionState } from '@/lib/types';
import {
  calculatePayroll,
  workingDaysInPeriod,
  type BpjsConfig,
  type ComponentLine,
} from '@/lib/payroll-engine';
import type { PtkpStatus } from '@/lib/tax';
import { labelPeriode } from '@/lib/format';

async function bpjsConfig(): Promise<{ bpjs: BpjsConfig; lateCutPerMinute: number; cutAbsent: boolean }> {
  const c =
    (await prisma.companySetting.findUnique({ where: { id: 'singleton' } })) ??
    (await prisma.companySetting.create({ data: { id: 'singleton' } }));
  return {
    bpjs: {
      kesEmployeeRate: c.bpjsKesEmployeeRate,
      kesEmployerRate: c.bpjsKesEmployerRate,
      kesCap: c.bpjsKesCap,
      jhtEmployeeRate: c.bpjsJhtEmployeeRate,
      jhtEmployerRate: c.bpjsJhtEmployerRate,
      jpEmployeeRate: c.bpjsJpEmployeeRate,
      jpEmployerRate: c.bpjsJpEmployerRate,
      jpCap: c.bpjsJpCap,
      jkkRate: c.bpjsJkkRate,
      jkmRate: c.bpjsJkmRate,
    },
    lateCutPerMinute: c.lateCutPerMinute,
    cutAbsent: c.absentCutPerDay,
  };
}

const createSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Periode harus berformat YYYY-MM'),
  payDate: z.string().min(1, 'Tanggal bayar wajib diisi'),
  note: z.string().optional().nullable(),
});

export async function createRun(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');
  const parsed = createSchema.safeParse({
    period: fd.get('period'),
    payDate: fd.get('payDate'),
    note: fd.get('note'),
  });
  if (!parsed.success) return FAIL(parsed.error.issues[0].message);

  const ada = await prisma.payrollRun.findUnique({ where: { period: parsed.data.period } });
  if (ada) return FAIL(`Periode ${labelPeriode(parsed.data.period)} sudah pernah dibuat.`);

  const run = await prisma.payrollRun.create({
    data: {
      period: parsed.data.period,
      label: `Gaji ${labelPeriode(parsed.data.period)}`,
      payDate: new Date(parsed.data.payDate),
      note: parsed.data.note ?? null,
      status: 'DRAFT',
    },
  });

  await audit(session, 'CREATE', 'PayrollRun', run.id, `Proses gaji ${labelPeriode(run.period)} dibuat`);
  revalidatePath('/payroll');
  revalidatePath('/dashboard');
  return OK(`Proses gaji ${labelPeriode(run.period)} dibuat. Lanjutkan dengan menghitung.`);
}

/**
 * Menghitung ulang seluruh baris gaji periode ini dari sumber datanya:
 * data karyawan, komponen gaji, kehadiran, lembur yang disetujui, dan pinjaman.
 * Selalu dimulai dari nol agar hasilnya tidak bergantung riwayat perhitungan.
 */
export async function calculateRun(runId: string): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');

  const run = await prisma.payrollRun.findUnique({ where: { id: runId } });
  if (!run) return FAIL('Proses gaji tidak ditemukan.');
  if (run.status === 'PAID') return FAIL('Periode yang sudah dibayarkan tidak bisa dihitung ulang.');

  const [y, m] = run.period.split('-').map(Number);
  const awal = new Date(y, m - 1, 1);
  const akhir = new Date(y, m, 1);
  const isDecember = m === 12;

  const { bpjs, lateCutPerMinute, cutAbsent } = await bpjsConfig();
  const workingDays = workingDaysInPeriod(run.period);

  const employees = await prisma.employee.findMany({
    where: { status: { in: ['ACTIVE', 'ON_LEAVE'] }, joinDate: { lt: akhir } },
    include: { components: { include: { component: true } } },
  });

  if (employees.length === 0) return FAIL('Tidak ada karyawan aktif untuk diproses.');

  const ids = employees.map((e) => e.id);

  // Ambil sekaligus lalu kelompokkan di memori — jauh lebih murah
  // daripada empat kueri per karyawan.
  const [attendances, overtimes, loans, ytdItems] = await Promise.all([
    prisma.attendance.findMany({
      where: { employeeId: { in: ids }, date: { gte: awal, lt: akhir } },
      select: { employeeId: true, status: true, lateMinutes: true },
    }),
    prisma.overtime.findMany({
      where: { employeeId: { in: ids }, status: 'APPROVED', date: { gte: awal, lt: akhir } },
      select: { employeeId: true, hours: true, isHoliday: true },
    }),
    // Satu cicilan dipotong per periode: yang paling lama dulu.
    // Urutan wajib deterministik agar pinjaman yang dipotong di slip sama
    // dengan pinjaman yang saldonya dikurangi saat pembayaran.
    prisma.loan.findMany({
      where: { employeeId: { in: ids }, status: 'ACTIVE' },
      select: { employeeId: true, monthlyDeduction: true, remaining: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    isDecember
      ? prisma.payrollItem.findMany({
          where: {
            employeeId: { in: ids },
            run: { period: { startsWith: `${y}-` }, status: { in: ['APPROVED', 'PAID'] } },
          },
          select: {
            employeeId: true,
            taxableIncome: true,
            pph21: true,
            bpjsKesEmployee: true,
            bpjsJhtEmployee: true,
            bpjsJpEmployee: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const byEmployee = <T extends { employeeId: string }>(rows: T[]) => {
    const map = new Map<string, T[]>();
    for (const r of rows) {
      const arr = map.get(r.employeeId) ?? [];
      arr.push(r);
      map.set(r.employeeId, arr);
    }
    return map;
  };

  const attMap = byEmployee(attendances);
  const otMap = byEmployee(overtimes);
  const loanMap = byEmployee(loans);
  const ytdMap = byEmployee(ytdItems);

  let tg = 0, td = 0, tt = 0, tn = 0, tec = 0;
  const rows = [];

  for (const e of employees) {
    const lines: ComponentLine[] = e.components
      .filter((a) => a.component.active)
      .map((a) => ({
        code: a.component.code,
        name: a.component.name,
        type: a.component.type as 'ALLOWANCE' | 'DEDUCTION',
        amount:
          a.overrideAmount ??
          (a.component.calcType === 'PERCENT_OF_BASE'
            ? Math.round((e.baseSalary * a.component.percent) / 100)
            : a.component.amount),
        taxable: a.component.taxable,
      }));

    const att = attMap.get(e.id) ?? [];
    const count = (s: string) => att.filter((a) => a.status === s).length;
    const lateMinutes = att.reduce((s, a) => s + a.lateMinutes, 0);

    const ot = otMap.get(e.id) ?? [];
    const otWeekday = ot.filter((o) => !o.isHoliday).reduce((s, o) => s + o.hours, 0);
    const otHoliday = ot.filter((o) => o.isHoliday).reduce((s, o) => s + o.hours, 0);

    const loan = (loanMap.get(e.id) ?? [])[0];
    const loanDeduction = loan ? Math.min(loan.monthlyDeduction, loan.remaining) : 0;

    const ytd = ytdMap.get(e.id) ?? [];

    const hasil = calculatePayroll({
      employeeId: e.id,
      fullName: e.fullName,
      baseSalary: e.baseSalary,
      ptkpStatus: e.ptkpStatus as PtkpStatus,
      hasNpwp: Boolean(e.npwp),
      enrollBpjsKes: e.enrollBpjsKes,
      enrollBpjsTk: e.enrollBpjsTk,
      components: lines,
      overtimeHours: otWeekday,
      overtimeHolidayHours: otHoliday,
      presentDays: count('PRESENT') + count('LATE') + count('WFH'),
      absentDays: count('ABSENT'),
      leaveDays: count('LEAVE'),
      unpaidLeaveDays: 0,
      lateMinutes,
      loanDeduction,
      workingDays,
      lateCutPerMinute,
      cutAbsent,
      bpjs,
      isDecember,
      ytdGross: isDecember ? ytd.reduce((s, i) => s + i.taxableIncome, 0) : undefined,
      ytdTax: isDecember ? ytd.reduce((s, i) => s + i.pph21, 0) : undefined,
      ytdBpjsEmployee: isDecember
        ? ytd.reduce((s, i) => s + i.bpjsKesEmployee + i.bpjsJhtEmployee + i.bpjsJpEmployee, 0)
        : undefined,
    });

    rows.push({
      runId,
      employeeId: e.id,
      baseSalary: hasil.baseSalary,
      allowanceTaxable: hasil.allowanceTaxable,
      allowanceNonTax: hasil.allowanceNonTax,
      overtimePay: hasil.overtimePay,
      grossPay: hasil.grossPay,
      bpjsKesEmployee: hasil.bpjsKesEmployee,
      bpjsJhtEmployee: hasil.bpjsJhtEmployee,
      bpjsJpEmployee: hasil.bpjsJpEmployee,
      bpjsKesEmployer: hasil.bpjsKesEmployer,
      bpjsJhtEmployer: hasil.bpjsJhtEmployer,
      bpjsJpEmployer: hasil.bpjsJpEmployer,
      bpjsJkkEmployer: hasil.bpjsJkkEmployer,
      bpjsJkmEmployer: hasil.bpjsJkmEmployer,
      otherDeduction: hasil.otherDeduction,
      loanDeduction: hasil.loanDeduction,
      unpaidLeaveCut: hasil.unpaidLeaveCut,
      lateCut: hasil.lateCut,
      taxableIncome: hasil.taxableIncome,
      terRate: hasil.terRate,
      pph21: hasil.pph21,
      taxMethod: hasil.taxMethod,
      totalDeduction: hasil.totalDeduction,
      netPay: hasil.netPay,
      employerCost: hasil.employerCost,
      presentDays: count('PRESENT') + count('LATE') + count('WFH'),
      absentDays: count('ABSENT'),
      leaveDays: count('LEAVE'),
      overtimeHours: otWeekday + otHoliday,
      breakdown: JSON.stringify(hasil.breakdown),
    });

    tg += hasil.grossPay;
    td += hasil.totalDeduction;
    tt += hasil.pph21;
    tn += hasil.netPay;
    tec += hasil.employerCost;
  }

  // Hapus-lalu-tulis di dalam satu transaksi: kalau gagal di tengah,
  // periode tidak tertinggal dalam keadaan setengah terhitung.
  await prisma.$transaction([
    prisma.payrollItem.deleteMany({ where: { runId } }),
    prisma.payrollItem.createMany({ data: rows }),
    prisma.payrollRun.update({
      where: { id: runId },
      data: {
        status: 'CALCULATED',
        totalGross: tg,
        totalDeduction: td,
        totalTax: tt,
        totalNet: tn,
        totalEmployerCost: tec,
        headcount: rows.length,
        calculatedAt: new Date(),
      },
    }),
  ]);

  await audit(
    session,
    'RUN',
    'PayrollRun',
    runId,
    `Payroll ${labelPeriode(run.period)} dihitung untuk ${rows.length} karyawan`,
    { totalNet: tn },
  );

  revalidatePath('/payroll');
  revalidatePath(`/payroll/${runId}`);
  revalidatePath('/dashboard');
  return OK(`${rows.length} karyawan berhasil dihitung. Total bersih ${tn.toLocaleString('id-ID')}.`);
}

export async function approveRun(runId: string): Promise<ActionState> {
  const session = await requireRole('ADMIN');
  const run = await prisma.payrollRun.findUnique({ where: { id: runId } });
  if (!run) return FAIL('Proses gaji tidak ditemukan.');
  if (run.status !== 'CALCULATED') return FAIL('Hanya periode berstatus terhitung yang bisa disetujui.');

  await prisma.payrollRun.update({
    where: { id: runId },
    data: { status: 'APPROVED', approvedAt: new Date(), approvedBy: session.name },
  });

  await audit(session, 'APPROVE', 'PayrollRun', runId, `Payroll ${labelPeriode(run.period)} disetujui`);
  revalidatePath('/payroll');
  revalidatePath(`/payroll/${runId}`);
  revalidatePath('/dashboard');
  return OK('Proses gaji disetujui. Siap dibayarkan.');
}

export async function payRun(runId: string): Promise<ActionState> {
  const session = await requireRole('ADMIN');
  const run = await prisma.payrollRun.findUnique({ where: { id: runId } });
  if (!run) return FAIL('Proses gaji tidak ditemukan.');
  if (run.status !== 'APPROVED') return FAIL('Setujui dulu sebelum menandai sudah dibayar.');

  const items = await prisma.payrollItem.findMany({
    where: { runId },
    select: { employeeId: true, netPay: true, loanDeduction: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.payrollRun.update({
      where: { id: runId },
      data: { status: 'PAID', paidAt: new Date() },
    });

    // cicilan pinjaman baru berkurang setelah gaji benar-benar dibayarkan
    for (const it of items) {
      if (it.loanDeduction <= 0) continue;
      // urutan sama persis dengan calculateRun — lihat catatan di sana
      const loan = await tx.loan.findFirst({
        where: { employeeId: it.employeeId, status: 'ACTIVE' },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });
      if (!loan) continue;
      const sisa = Math.max(0, loan.remaining - it.loanDeduction);
      await tx.loan.update({
        where: { id: loan.id },
        data: { remaining: sisa, status: sisa === 0 ? 'SETTLED' : 'ACTIVE' },
      });
    }
  });

  // beri tahu tiap karyawan bahwa slipnya sudah tersedia
  const employees = await prisma.employee.findMany({
    where: { id: { in: items.map((i) => i.employeeId) }, userId: { not: null } },
    select: { userId: true },
  });
  await Promise.all(
    employees.map((e) =>
      notify(
        e.userId!,
        `Slip gaji ${labelPeriode(run.period)} tersedia`,
        'Gaji periode ini sudah dibayarkan. Slip bisa diunduh dari portal.',
        'success',
        '/me',
      ),
    ),
  );

  await audit(
    session,
    'RUN',
    'PayrollRun',
    runId,
    `Payroll ${labelPeriode(run.period)} dibayarkan ke ${items.length} karyawan`,
  );
  revalidatePath('/payroll');
  revalidatePath(`/payroll/${runId}`);
  revalidatePath('/dashboard');
  return OK(`Pembayaran ${items.length} karyawan dicatat.`);
}

export async function reopenRun(runId: string): Promise<ActionState> {
  const session = await requireRole('ADMIN');
  const run = await prisma.payrollRun.findUnique({ where: { id: runId } });
  if (!run) return FAIL('Proses gaji tidak ditemukan.');
  if (run.status === 'PAID') return FAIL('Periode yang sudah dibayarkan tidak bisa dibuka kembali.');

  await prisma.payrollRun.update({
    where: { id: runId },
    data: { status: 'CALCULATED', approvedAt: null, approvedBy: null },
  });
  await audit(session, 'UPDATE', 'PayrollRun', runId, `Persetujuan ${labelPeriode(run.period)} dicabut`);
  revalidatePath(`/payroll/${runId}`);
  return OK('Persetujuan dicabut. Periode bisa dihitung ulang.');
}

export async function deleteRun(runId: string): Promise<ActionState> {
  const session = await requireRole('ADMIN');
  const run = await prisma.payrollRun.findUnique({ where: { id: runId } });
  if (!run) return FAIL('Proses gaji tidak ditemukan.');
  if (run.status === 'PAID') return FAIL('Periode yang sudah dibayarkan tidak bisa dihapus.');

  await prisma.payrollRun.delete({ where: { id: runId } });
  await audit(session, 'DELETE', 'PayrollRun', runId, `Proses gaji ${labelPeriode(run.period)} dihapus`);
  revalidatePath('/payroll');
  revalidatePath('/dashboard');
  return OK('Proses gaji dihapus.');
}
