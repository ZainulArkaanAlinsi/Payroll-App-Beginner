'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { audit, requireRole } from '@/lib/auth';
import { FAIL, OK, type ActionState } from '@/lib/types';
import { validateFormula } from '@/lib/formula';

const schema = z
  .object({
    code: z.string().min(2, 'Kode minimal 2 karakter').max(12, 'Kode maksimal 12 karakter'),
    name: z.string().min(3, 'Nama minimal 3 karakter'),
    type: z.enum(['ALLOWANCE', 'DEDUCTION']),
    calcType: z.enum(['FIXED', 'PERCENT_OF_BASE', 'FORMULA']),
    amount: z.coerce.number().int().min(0),
    percent: z.coerce.number().min(0).max(100),
    formula: z.string().optional().nullable(),
    taxable: z.boolean(),
    countsForBpjs: z.boolean(),
    prorate: z.boolean(),
    isDefault: z.boolean(),
    active: z.boolean(),
    sortOrder: z.coerce.number().int().min(0).max(999),
    scopeDepartments: z.string().optional().nullable(),
    scopeLevels: z.string().optional().nullable(),
    note: z.string().optional().nullable(),
  })
  .refine(
    (d) =>
      d.calcType === 'FIXED'
        ? d.amount > 0
        : d.calcType === 'PERCENT_OF_BASE'
          ? d.percent > 0
          : Boolean(d.formula && d.formula.trim()),
    { message: 'Isi nominal, persentase, atau rumus sesuai cara hitung yang dipilih.' },
  );

export async function saveComponent(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');
  const id = fd.get('id') ? String(fd.get('id')) : null;

  const parsed = schema.safeParse({
    code: String(fd.get('code') ?? '').toUpperCase(),
    name: fd.get('name'),
    type: fd.get('type'),
    calcType: fd.get('calcType'),
    amount: fd.get('amount') || 0,
    percent: fd.get('percent') || 0,
    formula: fd.get('formula') || null,
    taxable: fd.get('taxable') === 'on',
    countsForBpjs: fd.get('countsForBpjs') === 'on',
    prorate: fd.get('prorate') === 'on',
    isDefault: fd.get('isDefault') === 'on',
    active: fd.get('active') === 'on',
    sortOrder: fd.get('sortOrder') || 0,
    scopeDepartments: fd.getAll('scopeDepartments').length
      ? JSON.stringify(fd.getAll('scopeDepartments').map(String))
      : null,
    scopeLevels: fd.getAll('scopeLevels').length
      ? JSON.stringify(fd.getAll('scopeLevels').map(String))
      : null,
    note: fd.get('note') || null,
  });
  if (!parsed.success) return FAIL(parsed.error.issues[0].message);

  // Rumus diperiksa di server juga, bukan hanya di peramban — rumus rusak
  // yang lolos ke basis data akan menggagalkan perhitungan seluruh periode.
  if (parsed.data.calcType === 'FORMULA') {
    const cek = validateFormula(parsed.data.formula ?? '');
    if (!cek.ok) return FAIL(`Rumus tidak sah: ${cek.pesan}`);
  }

  const bentrok = await prisma.salaryComponent.findFirst({
    where: { code: parsed.data.code, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (bentrok) return FAIL(`Kode ${parsed.data.code} sudah dipakai.`);

  if (id) {
    await prisma.salaryComponent.update({ where: { id }, data: parsed.data });
    await audit(session, 'UPDATE', 'SalaryComponent', id, `Komponen ${parsed.data.name} diperbarui`);
  } else {
    const c = await prisma.salaryComponent.create({ data: parsed.data });
    await audit(session, 'CREATE', 'SalaryComponent', c.id, `Komponen ${parsed.data.name} ditambahkan`);
  }

  revalidatePath('/compensation');
  return OK(id ? 'Komponen diperbarui. Hitung ulang payroll agar berlaku.' : 'Komponen ditambahkan.');
}

export async function deleteComponent(id: string): Promise<ActionState> {
  const session = await requireRole('ADMIN');
  const c = await prisma.salaryComponent.findUnique({
    where: { id },
    select: { name: true, _count: { select: { assignments: true } } },
  });
  if (!c) return FAIL('Komponen tidak ditemukan.');

  if (c._count.assignments > 0) {
    // Menghapus akan melepas komponen dari banyak karyawan sekaligus —
    // menonaktifkan lebih aman dan tetap menjaga riwayat slip lama.
    await prisma.salaryComponent.update({ where: { id }, data: { active: false } });
    await audit(session, 'UPDATE', 'SalaryComponent', id, `Komponen ${c.name} dinonaktifkan`);
    revalidatePath('/compensation');
    return OK(`Komponen dipakai ${c._count.assignments} karyawan, jadi dinonaktifkan saja.`);
  }

  await prisma.salaryComponent.delete({ where: { id } });
  await audit(session, 'DELETE', 'SalaryComponent', id, `Komponen ${c.name} dihapus`);
  revalidatePath('/compensation');
  return OK('Komponen dihapus.');
}

/** Menempelkan komponen ke seluruh karyawan aktif sekaligus. */
export async function assignToAll(componentId: string): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');
  const c = await prisma.salaryComponent.findUnique({ where: { id: componentId }, select: { name: true } });
  if (!c) return FAIL('Komponen tidak ditemukan.');

  const employees = await prisma.employee.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  // SQLite tidak mendukung skipDuplicates, jadi yang sudah punya disaring dulu
  // agar aksi ini tetap aman dijalankan berulang.
  const sudah = await prisma.employeeComponent.findMany({
    where: { componentId },
    select: { employeeId: true },
  });
  const punya = new Set(sudah.map((s) => s.employeeId));
  const baru = employees.filter((e) => !punya.has(e.id));

  if (baru.length > 0) {
    await prisma.employeeComponent.createMany({
      data: baru.map((e) => ({ employeeId: e.id, componentId })),
    });
  }

  await audit(session, 'UPDATE', 'SalaryComponent', componentId, `Komponen ${c.name} diterapkan ke semua karyawan aktif`);
  revalidatePath('/compensation');
  return baru.length === 0
    ? OK('Semua karyawan aktif sudah memiliki komponen ini.')
    : OK(`Komponen ditambahkan ke ${baru.length} karyawan.`);
}

const loanSchema = z.object({
  employeeId: z.string().min(1, 'Karyawan wajib dipilih'),
  principal: z.coerce.number().int().min(100_000, 'Pokok pinjaman minimal Rp 100.000'),
  tenorMonths: z.coerce.number().int().min(1).max(60),
  startPeriod: z.string().regex(/^\d{4}-\d{2}$/, 'Periode mulai harus berformat YYYY-MM'),
  note: z.string().optional().nullable(),
});

export async function saveLoan(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');
  const parsed = loanSchema.safeParse({
    employeeId: fd.get('employeeId'),
    principal: fd.get('principal'),
    tenorMonths: fd.get('tenorMonths'),
    startPeriod: fd.get('startPeriod'),
    note: fd.get('note') || null,
  });
  if (!parsed.success) return FAIL(parsed.error.issues[0].message);

  const d = parsed.data;
  const monthly = Math.round(d.principal / d.tenorMonths);

  const loan = await prisma.loan.create({
    data: {
      employeeId: d.employeeId,
      principal: d.principal,
      tenorMonths: d.tenorMonths,
      monthlyDeduction: monthly,
      remaining: d.principal,
      startPeriod: d.startPeriod,
      note: d.note,
    },
  });

  await audit(session, 'CREATE', 'Loan', loan.id, `Pinjaman karyawan dicatat sebesar ${d.principal}`);
  revalidatePath('/compensation');
  revalidatePath(`/employees/${d.employeeId}`);
  return OK(`Pinjaman dicatat. Potongan bulanan Rp ${monthly.toLocaleString('id-ID')}.`);
}

export async function settleLoan(id: string): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');
  await prisma.loan.update({ where: { id }, data: { status: 'SETTLED', remaining: 0 } });
  await audit(session, 'UPDATE', 'Loan', id, 'Pinjaman ditandai lunas');
  revalidatePath('/compensation');
  return OK('Pinjaman ditandai lunas.');
}
