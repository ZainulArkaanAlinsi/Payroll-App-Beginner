'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { audit, hashPassword, requireRole } from '@/lib/auth';
import { FAIL, OK, type ActionState } from '@/lib/types';

const employeeSchema = z.object({
  fullName: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Format surel tidak valid'),
  phone: z.string().optional().nullable(),
  nik: z.string().optional().nullable(),
  npwp: z.string().optional().nullable(),
  gender: z.enum(['M', 'F']).optional().nullable(),
  address: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  positionId: z.string().optional().nullable(),
  joinDate: z.string().min(1, 'Tanggal bergabung wajib diisi'),
  employmentType: z.enum(['PERMANENT', 'CONTRACT', 'PROBATION', 'INTERN']),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED']),
  baseSalary: z.coerce.number().int().min(0, 'Gaji tidak boleh negatif'),
  ptkpStatus: z.enum(['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3']),
  bankName: z.string().optional().nullable(),
  bankAccount: z.string().optional().nullable(),
  annualLeaveQuota: z.coerce.number().int().min(0).max(60),
  enrollBpjsKes: z.coerce.boolean(),
  enrollBpjsTk: z.coerce.boolean(),
});

function read(fd: FormData) {
  const get = (k: string) => {
    const v = fd.get(k);
    return v === null || v === '' ? null : String(v);
  };
  return {
    fullName: get('fullName') ?? '',
    email: get('email') ?? '',
    phone: get('phone'),
    nik: get('nik'),
    npwp: get('npwp'),
    gender: get('gender'),
    address: get('address'),
    departmentId: get('departmentId'),
    positionId: get('positionId'),
    joinDate: get('joinDate') ?? '',
    employmentType: get('employmentType') ?? 'PERMANENT',
    status: get('status') ?? 'ACTIVE',
    baseSalary: get('baseSalary') ?? '0',
    ptkpStatus: get('ptkpStatus') ?? 'TK/0',
    bankName: get('bankName'),
    bankAccount: get('bankAccount'),
    annualLeaveQuota: get('annualLeaveQuota') ?? '12',
    enrollBpjsKes: fd.get('enrollBpjsKes') === 'on' || fd.get('enrollBpjsKes') === 'true',
    enrollBpjsTk: fd.get('enrollBpjsTk') === 'on' || fd.get('enrollBpjsTk') === 'true',
  };
}

export async function saveEmployee(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');
  const id = fd.get('id') ? String(fd.get('id')) : null;

  const parsed = employeeSchema.safeParse(read(fd));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return FAIL(issue.message, { [String(issue.path[0])]: issue.message });
  }
  const d = parsed.data;

  // Surel dipakai untuk login, jadi harus unik lintas karyawan.
  const bentrok = await prisma.employee.findFirst({
    where: { email: d.email, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (bentrok) return FAIL('Surel sudah dipakai karyawan lain.', { email: 'Sudah dipakai' });

  const data = {
    fullName: d.fullName,
    email: d.email.toLowerCase(),
    phone: d.phone,
    nik: d.nik,
    npwp: d.npwp,
    gender: d.gender,
    address: d.address,
    departmentId: d.departmentId,
    positionId: d.positionId,
    joinDate: new Date(d.joinDate),
    employmentType: d.employmentType,
    status: d.status,
    baseSalary: d.baseSalary,
    ptkpStatus: d.ptkpStatus,
    bankName: d.bankName,
    bankAccount: d.bankAccount,
    bankHolder: d.fullName,
    annualLeaveQuota: d.annualLeaveQuota,
    enrollBpjsKes: d.enrollBpjsKes,
    enrollBpjsTk: d.enrollBpjsTk,
  };

  try {
    if (id) {
      await prisma.employee.update({ where: { id }, data });
      await audit(session, 'UPDATE', 'Employee', id, `Data karyawan ${d.fullName} diperbarui`);
    } else {
      // nomor induk berurutan
      const last = await prisma.employee.findFirst({
        orderBy: { employeeNo: 'desc' },
        select: { employeeNo: true },
      });
      const next = last ? parseInt(last.employeeNo.split('-')[1] ?? '0', 10) + 1 : 1;
      const employeeNo = `ND-${String(next).padStart(4, '0')}`;

      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: d.fullName,
          password: await hashPassword('password123'),
          role: 'EMPLOYEE',
          avatarHue: Math.floor(Math.random() * 360),
        },
      });

      const created = await prisma.employee.create({
        data: { ...data, employeeNo, userId: user.id },
      });

      // komponen bawaan langsung menempel supaya slip pertama tidak kosong
      const defaults = await prisma.salaryComponent.findMany({
        where: { isDefault: true, active: true },
        select: { id: true },
      });
      if (defaults.length) {
        await prisma.employeeComponent.createMany({
          data: defaults.map((c) => ({ employeeId: created.id, componentId: c.id })),
        });
      }

      await audit(session, 'CREATE', 'Employee', created.id, `Karyawan baru ${d.fullName} ditambahkan`);
    }
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : 'Gagal menyimpan data karyawan.');
  }

  revalidatePath('/employees');
  revalidatePath('/dashboard');
  if (id) revalidatePath(`/employees/${id}`);
  return OK(id ? 'Data karyawan diperbarui.' : 'Karyawan baru ditambahkan.');
}

export async function deleteEmployee(id: string): Promise<ActionState> {
  const session = await requireRole('ADMIN');
  const emp = await prisma.employee.findUnique({ where: { id }, select: { fullName: true, userId: true } });
  if (!emp) return FAIL('Karyawan tidak ditemukan.');

  const punyaSlip = await prisma.payrollItem.count({ where: { employeeId: id } });
  if (punyaSlip > 0) {
    // Menghapus akan merusak riwayat penggajian — nonaktifkan saja.
    await prisma.employee.update({ where: { id }, data: { status: 'RESIGNED', endDate: new Date() } });
    await audit(session, 'UPDATE', 'Employee', id, `${emp.fullName} ditandai mengundurkan diri`);
    revalidatePath('/employees');
    return OK('Karyawan punya riwayat gaji, jadi statusnya diubah menjadi mengundurkan diri.');
  }

  await prisma.employee.delete({ where: { id } });
  if (emp.userId) await prisma.user.delete({ where: { id: emp.userId } }).catch(() => {});
  await audit(session, 'DELETE', 'Employee', id, `Karyawan ${emp.fullName} dihapus`);
  revalidatePath('/employees');
  return OK('Karyawan dihapus.');
}

export async function toggleComponent(
  employeeId: string,
  componentId: string,
  attach: boolean,
): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');
  if (attach) {
    await prisma.employeeComponent.upsert({
      where: { employeeId_componentId: { employeeId, componentId } },
      create: { employeeId, componentId },
      update: {},
    });
  } else {
    await prisma.employeeComponent
      .delete({ where: { employeeId_componentId: { employeeId, componentId } } })
      .catch(() => {});
  }
  await audit(session, 'UPDATE', 'Employee', employeeId, `Komponen gaji karyawan disesuaikan`);
  revalidatePath(`/employees/${employeeId}`);
  return OK(attach ? 'Komponen ditambahkan.' : 'Komponen dilepas.');
}
