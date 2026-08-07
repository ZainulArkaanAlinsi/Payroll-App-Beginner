'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { audit, requireRole } from '@/lib/auth';
import { FAIL, OK, type ActionState } from '@/lib/types';

const deptSchema = z.object({
  code: z.string().min(2, 'Kode minimal 2 karakter').max(8, 'Kode maksimal 8 karakter'),
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  costCenter: z.string().optional().nullable(),
});

export async function saveDepartment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');
  const id = fd.get('id') ? String(fd.get('id')) : null;

  const parsed = deptSchema.safeParse({
    code: String(fd.get('code') ?? '').toUpperCase(),
    name: fd.get('name'),
    costCenter: fd.get('costCenter') || null,
  });
  if (!parsed.success) return FAIL(parsed.error.issues[0].message);

  const bentrok = await prisma.department.findFirst({
    where: { code: parsed.data.code, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (bentrok) return FAIL(`Kode ${parsed.data.code} sudah dipakai.`);

  if (id) {
    await prisma.department.update({ where: { id }, data: parsed.data });
    await audit(session, 'UPDATE', 'Department', id, `Departemen ${parsed.data.name} diperbarui`);
  } else {
    const d = await prisma.department.create({ data: parsed.data });
    await audit(session, 'CREATE', 'Department', d.id, `Departemen ${parsed.data.name} ditambahkan`);
  }

  revalidatePath('/org');
  return OK(id ? 'Departemen diperbarui.' : 'Departemen ditambahkan.');
}

export async function deleteDepartment(id: string): Promise<ActionState> {
  const session = await requireRole('ADMIN');
  const dept = await prisma.department.findUnique({
    where: { id },
    select: { name: true, _count: { select: { employees: true } } },
  });
  if (!dept) return FAIL('Departemen tidak ditemukan.');
  if (dept._count.employees > 0) {
    return FAIL(`Masih ada ${dept._count.employees} karyawan di departemen ini. Pindahkan dulu.`);
  }

  await prisma.department.delete({ where: { id } });
  await audit(session, 'DELETE', 'Department', id, `Departemen ${dept.name} dihapus`);
  revalidatePath('/org');
  return OK('Departemen dihapus.');
}

const posSchema = z.object({
  title: z.string().min(2, 'Nama jabatan minimal 2 karakter'),
  level: z.enum(['INTERN', 'STAFF', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR']),
  departmentId: z.string().min(1, 'Departemen wajib dipilih'),
  minSalary: z.coerce.number().int().min(0),
  maxSalary: z.coerce.number().int().min(0),
});

export async function savePosition(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');
  const id = fd.get('id') ? String(fd.get('id')) : null;

  const parsed = posSchema.safeParse({
    title: fd.get('title'),
    level: fd.get('level'),
    departmentId: fd.get('departmentId'),
    minSalary: fd.get('minSalary') || 0,
    maxSalary: fd.get('maxSalary') || 0,
  });
  if (!parsed.success) return FAIL(parsed.error.issues[0].message);
  if (parsed.data.maxSalary > 0 && parsed.data.maxSalary < parsed.data.minSalary) {
    return FAIL('Gaji maksimum tidak boleh lebih kecil dari minimum.');
  }

  if (id) {
    await prisma.position.update({ where: { id }, data: parsed.data });
    await audit(session, 'UPDATE', 'Position', id, `Posisi ${parsed.data.title} diperbarui`);
  } else {
    const p = await prisma.position.create({ data: parsed.data });
    await audit(session, 'CREATE', 'Position', p.id, `Posisi ${parsed.data.title} ditambahkan`);
  }

  revalidatePath('/org');
  return OK(id ? 'Posisi diperbarui.' : 'Posisi ditambahkan.');
}

export async function deletePosition(id: string): Promise<ActionState> {
  const session = await requireRole('ADMIN');
  const pos = await prisma.position.findUnique({
    where: { id },
    select: { title: true, _count: { select: { employees: true } } },
  });
  if (!pos) return FAIL('Posisi tidak ditemukan.');
  if (pos._count.employees > 0) {
    return FAIL(`Masih ada ${pos._count.employees} karyawan pada posisi ini.`);
  }

  await prisma.position.delete({ where: { id } });
  await audit(session, 'DELETE', 'Position', id, `Posisi ${pos.title} dihapus`);
  revalidatePath('/org');
  return OK('Posisi dihapus.');
}
