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
  type BreakdownRow,
  type TaxMethod,
} from '@/lib/payroll-engine';
import { resolveAll, buildVariables } from '@/lib/components';
import {
  pilihAturan,
  lateConfigDari,
  overtimeConfigDari,
  type PolicyRow,
} from '@/lib/policy';
import type { PtkpStatus } from '@/lib/tax';
import { labelPeriode } from '@/lib/format';
import { hitungThr, masaKerjaBulan, pajakThr } from '@/lib/thr';
import { pph21Ter } from '@/lib/tax';

async function bpjsConfig(): Promise<{ bpjs: BpjsConfig; cutAbsent: boolean }> {
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
    cutAbsent: c.absentCutPerDay,
  };
}

const createSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Periode harus berformat YYYY-MM'),
  payDate: z.string().min(1, 'Tanggal bayar wajib diisi'),
  kind: z.enum(['REGULAR', 'THR']),
  holidayName: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export async function createRun(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');
  const parsed = createSchema.safeParse({
    period: fd.get('period'),
    payDate: fd.get('payDate'),
    kind: fd.get('kind') || 'REGULAR',
    holidayName: fd.get('holidayName') || null,
    note: fd.get('note'),
  });
  if (!parsed.success) return FAIL(parsed.error.issues[0].message);
  if (parsed.data.kind === 'THR' && !parsed.data.holidayName?.trim()) {
    return FAIL('Sebutkan nama hari rayanya — ikut tercetak di slip THR.');
  }

  const ada = await prisma.payrollRun.findUnique({ where: { period: parsed.data.period } });
  if (ada) return FAIL(`Periode ${labelPeriode(parsed.data.period)} sudah pernah dibuat.`);

  const run = await prisma.payrollRun.create({
    data: {
      period: parsed.data.period,
      label:
        parsed.data.kind === 'THR'
          ? `THR ${parsed.data.holidayName}`
          : `Gaji ${labelPeriode(parsed.data.period)}`,
      kind: parsed.data.kind,
      holidayName: parsed.data.holidayName ?? null,
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

  if (run.kind === 'THR') return hitungRunThr(runId);

  const [y, m] = run.period.split('-').map(Number);
  const awal = new Date(y, m - 1, 1);
  const akhir = new Date(y, m, 1);
  const isDecember = m === 12;

  const { bpjs, cutAbsent } = await bpjsConfig();
  // Aturan divisi diambil sekali, lalu dipilih per karyawan di memori.
  const policies = (await prisma.policyRule.findMany({ where: { active: true } })) as PolicyRow[];
  const workingDays = workingDaysInPeriod(run.period);

  const employees = await prisma.employee.findMany({
    where: { status: { in: ['ACTIVE', 'ON_LEAVE'] }, joinDate: { lt: akhir } },
    include: {
      components: { include: { component: true } },
      position: { select: { level: true } },
    },
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
      select: { employeeId: true, hours: true, isHoliday: true, amount: true },
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

  const masalahRumus: { nama: string; kode: string; pesan: string }[] = [];

  for (const e of employees) {
    const att = attMap.get(e.id) ?? [];
    const count = (s: string) => att.filter((a) => a.status === s).length;
    const lateMinutes = att.reduce((s, a) => s + a.lateMinutes, 0);

    const ot = otMap.get(e.id) ?? [];
    const otWeekday = ot.filter((o) => !o.isHoliday).reduce((s, o) => s + o.hours, 0);
    const otHoliday = ot.filter((o) => o.isHoliday).reduce((s, o) => s + o.hours, 0);
    // Jumlah nilai yang sudah dikunci saat masing-masing lembur disetujui.
    const otLocked = ot.reduce((s, o) => s + o.amount, 0);

    const loan = (loanMap.get(e.id) ?? [])[0];
    const loanDeduction = loan ? Math.min(loan.monthlyDeduction, loan.remaining) : 0;

    const ytd = ytdMap.get(e.id) ?? [];

    const presentDays = count('PRESENT') + count('LATE') + count('WFH');

    // Prorata: karyawan yang baru masuk atau berhenti di tengah periode
    // hanya dibayar untuk hari kerja sejak/ sampai tanggal tersebut.
    const mulai = e.joinDate > awal ? e.joinDate : awal;
    const selesai = e.endDate && e.endDate < akhir ? e.endDate : new Date(akhir.getTime() - 1);
    let paidDays = 0;
    for (const d = new Date(mulai); d <= selesai; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) paidDays++;
    }
    paidDays = Math.min(workingDays, paidDays);

    const masaKerjaBulan = Math.max(
      0,
      (y - e.joinDate.getFullYear()) * 12 + (m - 1 - e.joinDate.getMonth()),
    );
    const tanggungan = Number(e.ptkpStatus.split('/')[1] ?? 0);

    // Rumus racikan HR diselesaikan lewat resolver bersama — halaman
    // simulasi karyawan memakai jalur yang sama, jadi angkanya tidak
    // pernah berbeda antara pratinjau dan hasil sungguhan.
    const { lines, errors } = resolveAll(e.components, {
      departmentId: e.departmentId,
      level: e.position?.level ?? null,
      baseSalary: e.baseSalary,
      variables: buildVariables({
        baseSalary: e.baseSalary,
        fixedAllowance: 0,
        workingDays,
        presentDays,
        absentDays: count('ABSENT'),
        leaveDays: count('LEAVE'),
        overtimeHours: otWeekday,
        overtimeHolidayHours: otHoliday,
        lateMinutes,
        monthsOfService: masaKerjaBulan,
        dependents: tanggungan,
        paidDays,
      }),
    });

    for (const er of errors) {
      masalahRumus.push({ nama: e.fullName, kode: er.code, pesan: er.pesan });
    }

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
      overtimeLocked: otLocked,
      taxMethod: e.taxMethod as TaxMethod,
      paidDays,
      presentDays,
      absentDays: count('ABSENT'),
      leaveDays: count('LEAVE'),
      unpaidLeaveDays: 0,
      lateMinutes,
      loanDeduction,
      workingDays,
      cutAbsent,
      latePolicy: lateConfigDari(pilihAturan(policies, 'LATE', e.departmentId, e.position?.level ?? null)),
      overtimePolicy: overtimeConfigDari(
        pilihAturan(policies, 'OVERTIME', e.departmentId, e.position?.level ?? null),
      ),
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
      taxAllowance: hasil.taxAllowance,
      prorateDays: hasil.prorateDays,
      terRate: hasil.terRate,
      pph21: hasil.pph21,
      taxMethod: hasil.taxMethod,
      totalDeduction: hasil.totalDeduction,
      netPay: hasil.netPay,
      employerCost: hasil.employerCost,
      presentDays,
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
  // Persetujuan lama juga dibatalkan karena angkanya berubah.
  await prisma.$transaction([
    prisma.runApproval.deleteMany({ where: { runId } }),
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
  const dasar = `${rows.length} karyawan dihitung. Total bersih Rp ${tn.toLocaleString('id-ID')}.`;
  if (masalahRumus.length > 0) {
    // Rumus yang gagal tidak membatalkan payroll — komponennya dilewati,
    // tetapi HR harus tahu supaya bisa segera memperbaikinya.
    const contoh = masalahRumus.slice(0, 3).map((m) => `${m.kode} (${m.nama}): ${m.pesan}`).join('; ');
    return OK(`${dasar} Namun ${masalahRumus.length} komponen berumus gagal dihitung dan dilewati — ${contoh}`);
  }
  return OK(dasar);
}

/**
 * Memutuskan satu tahap pada alur persetujuan yang disusun HR.
 *
 * Periode baru berstatus APPROVED setelah seluruh tahap aktif disetujui
 * berurutan. Selama masih ada tahap yang menunggu, angkanya tetap bisa
 * dihitung ulang — itulah gunanya berjenjang.
 */
export async function decideRunStep(
  runId: string,
  stepId: string,
  decision: 'APPROVED' | 'REJECTED',
  note?: string,
): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');

  const run = await prisma.payrollRun.findUnique({ where: { id: runId } });
  if (!run) return FAIL('Proses gaji tidak ditemukan.');
  if (run.status !== 'CALCULATED') {
    return FAIL('Hanya periode berstatus terhitung yang bisa ditinjau.');
  }

  const steps = await prisma.approvalStep.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  });
  const step = steps.find((s) => s.id === stepId);
  if (!step) return FAIL('Tahap persetujuan tidak ditemukan atau sudah dinonaktifkan.');

  // Peran penentu dikunci di server; menyembunyikan tombol saja tidak cukup.
  if (session.role !== step.role && session.role !== 'ADMIN') {
    return FAIL(`Tahap ini hanya boleh diputuskan oleh ${step.role === 'HR' ? 'HRD' : 'administrator'}.`);
  }

  const sudah = await prisma.runApproval.findMany({ where: { runId } });
  const sudahSet = new Set(sudah.filter((a) => a.decision === 'APPROVED').map((a) => a.stepId));

  // Tahap harus dilalui berurutan — tidak boleh melompati atasan.
  const berikutnya = steps.find((s) => !sudahSet.has(s.id));
  if (!berikutnya || berikutnya.id !== stepId) {
    return FAIL(
      berikutnya
        ? `Selesaikan tahap "${berikutnya.name}" terlebih dahulu.`
        : 'Seluruh tahap sudah diselesaikan.',
    );
  }

  if (decision === 'REJECTED') {
    // Penolakan menghapus jejak persetujuan sebelumnya: setelah diperbaiki,
    // alurnya harus diulang dari awal supaya tidak ada tahap yang terlewat.
    await prisma.$transaction([
      prisma.runApproval.deleteMany({ where: { runId } }),
      prisma.runApproval.create({
        data: { runId, stepId, decidedBy: session.name, decision: 'REJECTED', note: note || null },
      }),
    ]);
    await audit(session, 'REJECT', 'PayrollRun', runId, `Tahap "${step.name}" menolak payroll ${labelPeriode(run.period)}`);
    revalidatePath(`/payroll/${runId}`);
    return OK(`Ditolak pada tahap "${step.name}". Alur persetujuan diulang dari awal.`);
  }

  await prisma.runApproval.upsert({
    where: { runId_stepId: { runId, stepId } },
    create: { runId, stepId, decidedBy: session.name, decision: 'APPROVED', note: note || null },
    update: { decidedBy: session.name, decision: 'APPROVED', note: note || null, decidedAt: new Date() },
  });

  const terakhir = steps[steps.length - 1]?.id === stepId;
  if (terakhir) {
    await prisma.payrollRun.update({
      where: { id: runId },
      data: { status: 'APPROVED', approvedAt: new Date(), approvedBy: session.name },
    });
  }

  await audit(session, 'APPROVE', 'PayrollRun', runId, `Tahap "${step.name}" menyetujui payroll ${labelPeriode(run.period)}`);
  revalidatePath('/payroll');
  revalidatePath(`/payroll/${runId}`);
  revalidatePath('/dashboard');

  return OK(
    terakhir
      ? 'Seluruh tahap selesai. Proses gaji disetujui dan siap dibayarkan.'
      : `Tahap "${step.name}" disetujui. Menunggu tahap berikutnya.`,
  );
}

/** Persetujuan sekali jalan — dipakai bila HR belum menyusun alur bertahap. */
export async function approveRun(runId: string): Promise<ActionState> {
  const session = await requireRole('ADMIN');
  const run = await prisma.payrollRun.findUnique({ where: { id: runId } });
  if (!run) return FAIL('Proses gaji tidak ditemukan.');
  if (run.status !== 'CALCULATED') return FAIL('Hanya periode berstatus terhitung yang bisa disetujui.');

  const jumlahTahap = await prisma.approvalStep.count({ where: { active: true } });
  if (jumlahTahap > 0) {
    return FAIL('Perusahaan ini memakai alur bertahap — setujui lewat tahapnya satu per satu.');
  }

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

  // Jejak persetujuan ikut dihapus: angka yang disetujui sudah tidak berlaku,
  // jadi seluruh tahap wajib meninjau ulang.
  await prisma.$transaction([
    prisma.runApproval.deleteMany({ where: { runId } }),
    prisma.payrollRun.update({
      where: { id: runId },
      data: { status: 'CALCULATED', approvedAt: null, approvedBy: null },
    }),
  ]);
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

/**
 * Menghitung satu proses THR.
 *
 * Dipisah dari perhitungan gaji bulanan karena dasarnya berbeda: tidak ada
 * kehadiran, lembur, potongan komponen, maupun iuran BPJS — THR bukan upah
 * bulanan, jadi tidak menjadi dasar pengali BPJS. Yang dipotong hanya
 * PPh 21, dan itu pun memakai metode selisih karena THR tergolong
 * penghasilan tidak teratur.
 */
async function hitungRunThr(runId: string): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');

  const run = await prisma.payrollRun.findUnique({ where: { id: runId } });
  if (!run) return FAIL('Proses THR tidak ditemukan.');
  if (run.status === 'PAID') return FAIL('Periode yang sudah dibayarkan tidak bisa dihitung ulang.');

  // Masa kerja diukur sampai tanggal pembayaran THR.
  const acuan = run.payDate;

  const employees = await prisma.employee.findMany({
    where: { status: { in: ['ACTIVE', 'ON_LEAVE'] }, joinDate: { lte: acuan } },
    include: {
      components: { include: { component: true } },
      position: { select: { level: true } },
    },
  });

  if (employees.length === 0) return FAIL('Tidak ada karyawan aktif untuk diproses.');

  // Bruto reguler terakhir dipakai sebagai dasar pajak selisih. Bila belum
  // ada riwayat, dihitung dari struktur upah yang berlaku sekarang.
  const terakhir = await prisma.payrollItem.findMany({
    where: {
      employeeId: { in: employees.map((e) => e.id) },
      run: { kind: 'REGULAR', status: { in: ['APPROVED', 'PAID'] } },
    },
    orderBy: { run: { period: 'desc' } },
    select: { employeeId: true, taxableIncome: true },
  });
  const petaBruto = new Map<string, number>();
  for (const t of terakhir) if (!petaBruto.has(t.employeeId)) petaBruto.set(t.employeeId, t.taxableIncome);

  let tg = 0, td = 0, tt = 0, tn = 0, tec = 0;
  const rows = [];
  let belumBerhak = 0;

  for (const e of employees) {
    // Upah dasar THR: gaji pokok ditambah tunjangan tetap. Komponen berumus
    // dikecualikan karena nilainya bergantung kehadiran, sehingga bukan
    // tunjangan tetap menurut PP 36/2021.
    const tunjanganTetap = e.components
      .filter(
        (a) =>
          a.component.active &&
          a.component.type === 'ALLOWANCE' &&
          a.component.calcType !== 'FORMULA',
      )
      .reduce(
        (t, a) =>
          t +
          (a.overrideAmount ??
            (a.component.calcType === 'PERCENT_OF_BASE'
              ? Math.round((e.baseSalary * a.component.percent) / 100)
              : a.component.amount)),
        0,
      );

    const upah = e.baseSalary + tunjanganTetap;
    const bulan = masaKerjaBulan(e.joinDate, acuan);
    const thr = hitungThr(upah, bulan);

    if (thr.amount === 0) {
      belumBerhak++;
      continue;
    }

    const brutoReguler = petaBruto.get(e.id) ?? upah;
    const ptkp = e.ptkpStatus as PtkpStatus;
    const punyaNpwp = Boolean(e.npwp);

    const { pajak, pajakDenganThr, pajakTanpaThr } = pajakThr(brutoReguler, thr.amount, (b) =>
      pph21Ter(Math.max(0, b), ptkp, punyaNpwp).tax,
    );

    const netPay = Math.max(0, thr.amount - pajak);
    const tarif = pph21Ter(Math.max(0, brutoReguler + thr.amount), ptkp, punyaNpwp).rate;

    const breakdown: BreakdownRow[] = [
      {
        group: 'EARNING',
        label: 'Tunjangan Hari Raya',
        amount: thr.amount,
        note: `${thr.note} Dasar upah ${upah.toLocaleString('id-ID')}.`,
      },
    ];
    if (pajak > 0) {
      breakdown.push({
        group: 'DEDUCTION',
        label: `PPh 21 atas THR (TER ${tarif}%)`,
        amount: pajak,
        note: `Selisih pajak: ${pajakDenganThr.toLocaleString('id-ID')} dengan THR − ${pajakTanpaThr.toLocaleString('id-ID')} tanpa THR.`,
      });
    }

    rows.push({
      runId,
      employeeId: e.id,
      baseSalary: 0,
      allowanceTaxable: thr.amount,
      allowanceNonTax: 0,
      overtimePay: 0,
      grossPay: thr.amount,
      thrAmount: thr.amount,
      serviceMonths: bulan,
      bpjsKesEmployee: 0,
      bpjsJhtEmployee: 0,
      bpjsJpEmployee: 0,
      bpjsKesEmployer: 0,
      bpjsJhtEmployer: 0,
      bpjsJpEmployer: 0,
      bpjsJkkEmployer: 0,
      bpjsJkmEmployer: 0,
      otherDeduction: 0,
      loanDeduction: 0,
      unpaidLeaveCut: 0,
      lateCut: 0,
      taxableIncome: thr.amount,
      taxAllowance: 0,
      prorateDays: 0,
      terRate: tarif,
      pph21: pajak,
      taxMethod: 'TER',
      totalDeduction: pajak,
      netPay,
      // THR tidak dikenai iuran BPJS, jadi biaya perusahaan sama dengan bruto
      employerCost: thr.amount,
      presentDays: 0,
      absentDays: 0,
      leaveDays: 0,
      overtimeHours: 0,
      breakdown: JSON.stringify(breakdown),
    });

    tg += thr.amount;
    td += pajak;
    tt += pajak;
    tn += netPay;
    tec += thr.amount;
  }

  if (rows.length === 0) {
    return FAIL('Tidak ada karyawan yang berhak menerima THR pada tanggal pembayaran ini.');
  }

  await prisma.$transaction([
    prisma.runApproval.deleteMany({ where: { runId } }),
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

  await audit(session, 'RUN', 'PayrollRun', runId, `THR ${run.holidayName ?? ''} dihitung untuk ${rows.length} karyawan`);
  revalidatePath('/payroll');
  revalidatePath(`/payroll/${runId}`);
  revalidatePath('/dashboard');

  const dasar = `${rows.length} karyawan berhak THR. Total bersih Rp ${tn.toLocaleString('id-ID')}.`;
  return belumBerhak > 0
    ? OK(`${dasar} ${belumBerhak} karyawan belum genap sebulan masa kerja sehingga belum berhak.`)
    : OK(dasar);
}
