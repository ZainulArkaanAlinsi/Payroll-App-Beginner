'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { audit, requireRole } from '@/lib/auth';
import { FAIL, OK, type ActionState } from '@/lib/types';

// ─────────────────────── Aturan per divisi ───────────────────────

const aturanSchema = z.object({
  name: z.string().min(3, 'Nama aturan minimal 3 karakter'),
  kind: z.enum(['LATE', 'OVERTIME']),
  priority: z.coerce.number().int().min(0).max(999),
  scopeDepartmentId: z.string().optional().nullable(),
  scopeLevel: z.string().optional().nullable(),
  active: z.boolean(),
});

export async function savePolicy(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');
  const id = fd.get('id') ? String(fd.get('id')) : null;

  const parsed = aturanSchema.safeParse({
    name: fd.get('name'),
    kind: fd.get('kind'),
    priority: fd.get('priority') || 0,
    scopeDepartmentId: fd.get('scopeDepartmentId') || null,
    scopeLevel: fd.get('scopeLevel') || null,
    active: fd.get('active') === 'on',
  });
  if (!parsed.success) return FAIL(parsed.error.issues[0].message);

  // Bentuk config berbeda per jenis aturan, jadi disusun terpisah lalu
  // disimpan sebagai JSON — kolomnya tetap satu apa pun jenisnya.
  let config: string;
  if (parsed.data.kind === 'LATE') {
    const c = {
      toleransiMenit: Math.max(0, Number(fd.get('toleransiMenit') ?? 0)),
      potonganPerMenit: Math.max(0, Number(fd.get('potonganPerMenit') ?? 0)),
      potonganMaksPerBulan: Math.max(0, Number(fd.get('potonganMaksPerBulan') ?? 0)),
    };
    if (Number.isNaN(c.toleransiMenit) || Number.isNaN(c.potonganPerMenit)) {
      return FAIL('Angka aturan keterlambatan tidak valid.');
    }
    config = JSON.stringify(c);
  } else {
    const metode = String(fd.get('metode') ?? 'KEPMENAKER');
    config = JSON.stringify(
      metode === 'FLAT'
        ? { metode: 'FLAT', tarifPerJam: Math.max(0, Number(fd.get('tarifPerJam') ?? 0)) }
        : { metode: 'KEPMENAKER', pembagi: Math.max(1, Number(fd.get('pembagi') ?? 173)) },
    );
  }

  const data = { ...parsed.data, config };

  if (id) {
    await prisma.policyRule.update({ where: { id }, data });
    await audit(session, 'UPDATE', 'PolicyRule', id, `Aturan "${data.name}" diperbarui`);
  } else {
    const r = await prisma.policyRule.create({ data });
    await audit(session, 'CREATE', 'PolicyRule', r.id, `Aturan "${data.name}" ditambahkan`);
  }

  revalidatePath('/racik');
  return OK(id ? 'Aturan diperbarui. Hitung ulang payroll agar berlaku.' : 'Aturan ditambahkan.');
}

export async function deletePolicy(id: string): Promise<ActionState> {
  const session = await requireRole('ADMIN');
  const r = await prisma.policyRule.findUnique({ where: { id }, select: { name: true } });
  if (!r) return FAIL('Aturan tidak ditemukan.');
  await prisma.policyRule.delete({ where: { id } });
  await audit(session, 'DELETE', 'PolicyRule', id, `Aturan "${r.name}" dihapus`);
  revalidatePath('/racik');
  return OK('Aturan dihapus.');
}

// ─────────────────── Alur persetujuan payroll ───────────────────

const tahapSchema = z.object({
  name: z.string().min(3, 'Nama tahap minimal 3 karakter'),
  role: z.enum(['ADMIN', 'HR']),
  note: z.string().optional().nullable(),
  active: z.boolean(),
});

export async function saveStep(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = await requireRole('ADMIN');
  const id = fd.get('id') ? String(fd.get('id')) : null;

  const parsed = tahapSchema.safeParse({
    name: fd.get('name'),
    role: fd.get('role'),
    note: fd.get('note') || null,
    active: fd.get('active') === 'on',
  });
  if (!parsed.success) return FAIL(parsed.error.issues[0].message);

  if (id) {
    await prisma.approvalStep.update({ where: { id }, data: parsed.data });
    await audit(session, 'UPDATE', 'ApprovalStep', id, `Tahap "${parsed.data.name}" diperbarui`);
  } else {
    const last = await prisma.approvalStep.findFirst({ orderBy: { sortOrder: 'desc' } });
    const s = await prisma.approvalStep.create({
      data: { ...parsed.data, sortOrder: (last?.sortOrder ?? 0) + 1 },
    });
    await audit(session, 'CREATE', 'ApprovalStep', s.id, `Tahap "${parsed.data.name}" ditambahkan`);
  }

  revalidatePath('/racik');
  revalidatePath('/payroll');
  return OK(id ? 'Tahap diperbarui.' : 'Tahap ditambahkan ke akhir alur.');
}

export async function moveStep(id: string, arah: 'UP' | 'DOWN'): Promise<ActionState> {
  await requireRole('ADMIN');
  const semua = await prisma.approvalStep.findMany({ orderBy: { sortOrder: 'asc' } });
  const i = semua.findIndex((s) => s.id === id);
  if (i < 0) return FAIL('Tahap tidak ditemukan.');

  const j = arah === 'UP' ? i - 1 : i + 1;
  if (j < 0 || j >= semua.length) return FAIL('Tahap sudah berada di ujung alur.');

  // Tukar nomor urut keduanya dalam satu transaksi agar tidak pernah
  // ada dua tahap dengan urutan sama, walau sesaat.
  await prisma.$transaction([
    prisma.approvalStep.update({ where: { id: semua[i].id }, data: { sortOrder: semua[j].sortOrder } }),
    prisma.approvalStep.update({ where: { id: semua[j].id }, data: { sortOrder: semua[i].sortOrder } }),
  ]);

  revalidatePath('/racik');
  return OK('Urutan alur diperbarui.');
}

export async function deleteStep(id: string): Promise<ActionState> {
  const session = await requireRole('ADMIN');
  const s = await prisma.approvalStep.findUnique({
    where: { id },
    select: { name: true, _count: { select: { approvals: true } } },
  });
  if (!s) return FAIL('Tahap tidak ditemukan.');

  if (s._count.approvals > 0) {
    // Menghapus akan memutus jejak persetujuan periode lampau.
    await prisma.approvalStep.update({ where: { id }, data: { active: false } });
    await audit(session, 'UPDATE', 'ApprovalStep', id, `Tahap "${s.name}" dinonaktifkan`);
    revalidatePath('/racik');
    return OK('Tahap sudah dipakai periode lampau, jadi dinonaktifkan saja.');
  }

  await prisma.approvalStep.delete({ where: { id } });
  await audit(session, 'DELETE', 'ApprovalStep', id, `Tahap "${s.name}" dihapus`);
  revalidatePath('/racik');
  return OK('Tahap dihapus.');
}

// ─────────────────────── Susunan slip gaji ───────────────────────

export async function togglePayslipField(id: string, visible: boolean): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');
  const f = await prisma.payslipField.findUnique({ where: { id }, select: { label: true } });
  if (!f) return FAIL('Kolom tidak ditemukan.');

  await prisma.payslipField.update({ where: { id }, data: { visible } });
  await audit(
    session,
    'UPDATE',
    'PayslipField',
    id,
    `Kolom slip "${f.label}" ${visible ? 'ditampilkan' : 'disembunyikan'}`,
  );
  revalidatePath('/racik');
  revalidatePath('/payslip', 'layout');
  return OK(visible ? `“${f.label}” ditampilkan di slip.` : `“${f.label}” disembunyikan dari slip.`);
}

// ──────────────────── Format berkas transfer bank ────────────────────

const SUMBER_KOLOM = [
  'rowNumber', 'employeeNo', 'fullName', 'bankHolder', 'bankName',
  'bankAccount', 'netPay', 'grossPay', 'period', 'department',
] as const;

const bankSchema = z.object({
  name: z.string().min(3, 'Nama format minimal 3 karakter'),
  delimiter: z.string().min(1).max(1),
  includeHeader: z.boolean(),
  isDefault: z.boolean(),
});

export async function saveBankFormat(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');
  const id = fd.get('id') ? String(fd.get('id')) : null;

  const parsed = bankSchema.safeParse({
    name: fd.get('name'),
    delimiter: fd.get('delimiter') || ';',
    includeHeader: fd.get('includeHeader') === 'on',
    isDefault: fd.get('isDefault') === 'on',
  });
  if (!parsed.success) return FAIL(parsed.error.issues[0].message);

  // Kolom datang sebagai tiga larik sejajar dari formulir.
  const headers = fd.getAll('colHeader').map(String);
  const sources = fd.getAll('colSource').map(String);
  const prefixes = fd.getAll('colPrefix').map(String);

  const columns = headers
    .map((h, i) => ({ header: h.trim(), source: sources[i] ?? '', prefix: prefixes[i] ?? '' }))
    .filter((c) => c.header && SUMBER_KOLOM.includes(c.source as (typeof SUMBER_KOLOM)[number]));

  if (columns.length === 0) return FAIL('Tambahkan minimal satu kolom yang valid.');

  const data = { ...parsed.data, columns: JSON.stringify(columns) };

  if (id) {
    await prisma.bankFormat.update({ where: { id }, data });
    await audit(session, 'UPDATE', 'BankFormat', id, `Format bank "${data.name}" diperbarui`);
  } else {
    const b = await prisma.bankFormat.create({ data });
    await audit(session, 'CREATE', 'BankFormat', b.id, `Format bank "${data.name}" ditambahkan`);
  }

  // Hanya boleh ada satu format bawaan.
  if (parsed.data.isDefault) {
    const target = id ?? (await prisma.bankFormat.findFirst({ orderBy: { createdAt: 'desc' } }))?.id;
    if (target) {
      await prisma.bankFormat.updateMany({ where: { NOT: { id: target } }, data: { isDefault: false } });
    }
  }

  revalidatePath('/racik');
  return OK(id ? 'Format bank diperbarui.' : 'Format bank ditambahkan.');
}

export async function deleteBankFormat(id: string): Promise<ActionState> {
  const session = await requireRole('ADMIN');
  const b = await prisma.bankFormat.findUnique({ where: { id }, select: { name: true } });
  if (!b) return FAIL('Format tidak ditemukan.');

  const sisa = await prisma.bankFormat.count();
  if (sisa <= 1) return FAIL('Sisakan minimal satu format transfer bank.');

  await prisma.bankFormat.delete({ where: { id } });
  await audit(session, 'DELETE', 'BankFormat', id, `Format bank "${b.name}" dihapus`);
  revalidatePath('/racik');
  return OK('Format bank dihapus.');
}
