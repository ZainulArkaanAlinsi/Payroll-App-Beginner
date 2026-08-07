'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { audit, canManage, notify, requireRole, requireSession } from '@/lib/auth';
import { FAIL, OK, type ActionState } from '@/lib/types';
import { overtimePay } from '@/lib/payroll-engine';
import { tanggal } from '@/lib/format';

// ───────────────────────────── Cuti ─────────────────────────────

const leaveSchema = z
  .object({
    employeeId: z.string().min(1, 'Karyawan wajib dipilih'),
    type: z.enum(['ANNUAL', 'SICK', 'UNPAID', 'MATERNITY', 'SPECIAL']),
    startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
    endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
    reason: z.string().min(6, 'Alasan minimal 6 karakter'),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
    message: 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
  });

/** Hitung hari kerja (Sen–Jum) dalam rentang, inklusif. */
function hariKerja(start: Date, end: Date): number {
  let n = 0;
  const d = new Date(start);
  while (d <= end) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) n++;
    d.setDate(d.getDate() + 1);
  }
  return Math.max(1, n);
}

export async function submitLeave(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = await requireSession();

  const employeeId = String(fd.get('employeeId') ?? '');
  // Karyawan biasa hanya boleh mengajukan untuk dirinya sendiri.
  if (!canManage(session.role) && employeeId !== session.employeeId) {
    return FAIL('Anda hanya bisa mengajukan cuti untuk diri sendiri.');
  }

  const parsed = leaveSchema.safeParse({
    employeeId,
    type: fd.get('type'),
    startDate: fd.get('startDate'),
    endDate: fd.get('endDate'),
    reason: fd.get('reason'),
  });
  if (!parsed.success) return FAIL(parsed.error.issues[0].message);

  const d = parsed.data;
  const start = new Date(d.startDate);
  const end = new Date(d.endDate);
  const days = hariKerja(start, end);

  // cek sisa kuota untuk cuti tahunan
  if (d.type === 'ANNUAL') {
    const emp = await prisma.employee.findUnique({
      where: { id: d.employeeId },
      select: { annualLeaveQuota: true },
    });
    const terpakai = await prisma.leaveRequest.aggregate({
      where: {
        employeeId: d.employeeId,
        type: 'ANNUAL',
        status: 'APPROVED',
        startDate: { gte: new Date(new Date().getFullYear(), 0, 1) },
      },
      _sum: { days: true },
    });
    const sisa = (emp?.annualLeaveQuota ?? 12) - (terpakai._sum.days ?? 0);
    if (days > sisa) {
      return FAIL(`Sisa kuota cuti tahunan tinggal ${sisa} hari, pengajuan ${days} hari melebihi kuota.`);
    }
  }

  // tolak tumpang tindih dengan pengajuan yang masih hidup
  const tumpang = await prisma.leaveRequest.findFirst({
    where: {
      employeeId: d.employeeId,
      status: { in: ['PENDING', 'APPROVED'] },
      startDate: { lte: end },
      endDate: { gte: start },
    },
    select: { id: true, startDate: true, endDate: true },
  });
  if (tumpang) {
    return FAIL(
      `Sudah ada pengajuan pada ${tanggal(tumpang.startDate)} – ${tanggal(tumpang.endDate)}.`,
    );
  }

  const req = await prisma.leaveRequest.create({
    data: {
      employeeId: d.employeeId,
      type: d.type,
      startDate: start,
      endDate: end,
      days,
      reason: d.reason,
    },
  });

  await audit(session, 'CREATE', 'LeaveRequest', req.id, `Pengajuan cuti ${days} hari dibuat`);

  // beri tahu para pengelola
  const managers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'HR'] }, isActive: true },
    select: { id: true },
  });
  await Promise.all(
    managers.map((m) =>
      notify(m.id, 'Pengajuan cuti baru', `${session.name} mengajukan cuti ${days} hari.`, 'info', '/leave'),
    ),
  );

  revalidatePath('/leave');
  revalidatePath('/me');
  return OK(`Pengajuan cuti ${days} hari kerja terkirim.`);
}

export async function reviewLeave(
  id: string,
  decision: 'APPROVED' | 'REJECTED',
  note?: string,
): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');
  const req = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { employee: { select: { fullName: true, userId: true } } },
  });
  if (!req) return FAIL('Pengajuan tidak ditemukan.');
  if (req.status !== 'PENDING') return FAIL('Pengajuan ini sudah ditinjau sebelumnya.');

  await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: decision,
      reviewedBy: session.name,
      reviewedAt: new Date(),
      reviewNote: note || null,
    },
  });

  // cuti yang disetujui langsung tercermin di kartu kehadiran
  if (decision === 'APPROVED') {
    const d = new Date(req.startDate);
    const rows = [];
    while (d <= req.endDate) {
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) rows.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    for (const date of rows) {
      await prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: req.employeeId, date } },
        create: { employeeId: req.employeeId, date, status: 'LEAVE' },
        update: { status: 'LEAVE' },
      });
    }
  }

  if (req.employee.userId) {
    await notify(
      req.employee.userId,
      `Pengajuan cuti ${decision === 'APPROVED' ? 'disetujui' : 'ditolak'}`,
      note || `Pengajuan cuti ${req.days} hari Anda telah ditinjau.`,
      decision === 'APPROVED' ? 'success' : 'warning',
      '/me',
    );
  }

  await audit(
    session,
    decision === 'APPROVED' ? 'APPROVE' : 'REJECT',
    'LeaveRequest',
    id,
    `Cuti ${req.employee.fullName} ${decision === 'APPROVED' ? 'disetujui' : 'ditolak'}`,
  );

  revalidatePath('/leave');
  revalidatePath('/attendance');
  revalidatePath('/me');
  return OK(decision === 'APPROVED' ? 'Cuti disetujui.' : 'Cuti ditolak.');
}

export async function cancelLeave(id: string): Promise<ActionState> {
  const session = await requireSession();
  const req = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!req) return FAIL('Pengajuan tidak ditemukan.');
  if (!canManage(session.role) && req.employeeId !== session.employeeId) {
    return FAIL('Anda tidak berhak membatalkan pengajuan ini.');
  }
  if (req.status !== 'PENDING') return FAIL('Hanya pengajuan yang masih menunggu bisa dibatalkan.');

  await prisma.leaveRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
  await audit(session, 'UPDATE', 'LeaveRequest', id, 'Pengajuan cuti dibatalkan');
  revalidatePath('/leave');
  revalidatePath('/me');
  return OK('Pengajuan dibatalkan.');
}

// ───────────────────────────── Lembur ─────────────────────────────

const otSchema = z.object({
  employeeId: z.string().min(1, 'Karyawan wajib dipilih'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  hours: z.coerce.number().min(0.5, 'Minimal 0,5 jam').max(12, 'Maksimal 12 jam per hari'),
  reason: z.string().min(6, 'Alasan minimal 6 karakter'),
});

export async function submitOvertime(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = await requireSession();
  const employeeId = String(fd.get('employeeId') ?? '');
  if (!canManage(session.role) && employeeId !== session.employeeId) {
    return FAIL('Anda hanya bisa mengajukan lembur untuk diri sendiri.');
  }

  const parsed = otSchema.safeParse({
    employeeId,
    date: fd.get('date'),
    hours: fd.get('hours'),
    reason: fd.get('reason'),
  });
  if (!parsed.success) return FAIL(parsed.error.issues[0].message);

  const d = parsed.data;
  const date = new Date(d.date);
  const isHoliday = date.getDay() === 0 || date.getDay() === 6;

  const ada = await prisma.overtime.findFirst({
    where: { employeeId: d.employeeId, date, status: { in: ['PENDING', 'APPROVED'] } },
    select: { id: true },
  });
  if (ada) return FAIL('Sudah ada pengajuan lembur untuk tanggal tersebut.');

  const req = await prisma.overtime.create({
    data: { employeeId: d.employeeId, date, hours: d.hours, isHoliday, reason: d.reason },
  });

  await audit(session, 'CREATE', 'Overtime', req.id, `Pengajuan lembur ${d.hours} jam dibuat`);

  const managers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'HR'] }, isActive: true },
    select: { id: true },
  });
  await Promise.all(
    managers.map((m) =>
      notify(m.id, 'Pengajuan lembur baru', `${session.name} mengajukan lembur ${d.hours} jam.`, 'info', '/overtime'),
    ),
  );

  revalidatePath('/overtime');
  revalidatePath('/me');
  return OK(`Pengajuan lembur ${d.hours} jam terkirim.`);
}

export async function reviewOvertime(
  id: string,
  decision: 'APPROVED' | 'REJECTED',
): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');
  const req = await prisma.overtime.findUnique({
    where: { id },
    include: { employee: { select: { fullName: true, baseSalary: true, userId: true } } },
  });
  if (!req) return FAIL('Pengajuan tidak ditemukan.');
  if (req.status !== 'PENDING') return FAIL('Pengajuan ini sudah ditinjau sebelumnya.');

  // Nilai rupiah dikunci saat persetujuan, memakai upah yang berlaku
  // saat itu — kenaikan gaji nanti tidak mengubah lembur yang lampau.
  const { amount } =
    decision === 'APPROVED'
      ? overtimePay(
          req.employee.baseSalary,
          req.isHoliday ? 0 : req.hours,
          req.isHoliday ? req.hours : 0,
        )
      : { amount: 0 };

  await prisma.overtime.update({
    where: { id },
    data: { status: decision, amount, reviewedBy: session.name, reviewedAt: new Date() },
  });

  if (req.employee.userId) {
    await notify(
      req.employee.userId,
      `Lembur ${decision === 'APPROVED' ? 'disetujui' : 'ditolak'}`,
      decision === 'APPROVED'
        ? `Lembur ${req.hours} jam disetujui senilai Rp ${amount.toLocaleString('id-ID')}.`
        : `Pengajuan lembur ${req.hours} jam Anda ditolak.`,
      decision === 'APPROVED' ? 'success' : 'warning',
      '/me',
    );
  }

  await audit(
    session,
    decision === 'APPROVED' ? 'APPROVE' : 'REJECT',
    'Overtime',
    id,
    `Lembur ${req.employee.fullName} ${decision === 'APPROVED' ? 'disetujui' : 'ditolak'}`,
  );

  revalidatePath('/overtime');
  revalidatePath('/me');
  return OK(decision === 'APPROVED' ? `Lembur disetujui senilai Rp ${amount.toLocaleString('id-ID')}.` : 'Lembur ditolak.');
}

// ─────────────────────────── Kehadiran ───────────────────────────

/** Absen masuk / pulang untuk karyawan yang sedang login. */
export async function clockAction(kind: 'IN' | 'OUT'): Promise<ActionState> {
  const session = await requireSession();
  if (!session.employeeId) return FAIL('Akun ini tidak tertaut ke data karyawan.');

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const setting = await prisma.companySetting.findUnique({ where: { id: 'singleton' } });
  const [jamMulai, menitMulai] = (setting?.workStart ?? '09:00').split(':').map(Number);
  const toleransi = setting?.lateToleranceMin ?? 15;

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: session.employeeId, date: today } },
  });

  if (kind === 'IN') {
    if (existing?.clockIn) return FAIL('Anda sudah absen masuk hari ini.');

    const batas = new Date(today);
    batas.setHours(jamMulai, menitMulai + toleransi, 0, 0);
    const telat = now > batas ? Math.round((now.getTime() - batas.getTime()) / 60000) : 0;

    await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: session.employeeId, date: today } },
      create: {
        employeeId: session.employeeId,
        date: today,
        clockIn: now,
        status: telat > 0 ? 'LATE' : 'PRESENT',
        lateMinutes: telat,
      },
      update: { clockIn: now, status: telat > 0 ? 'LATE' : 'PRESENT', lateMinutes: telat },
    });

    await audit(session, 'CREATE', 'Attendance', null, `${session.name} absen masuk`);
    revalidatePath('/me');
    revalidatePath('/attendance');
    return OK(telat > 0 ? `Absen masuk tercatat — terlambat ${telat} menit.` : 'Absen masuk tercatat. Selamat bekerja.');
  }

  if (!existing?.clockIn) return FAIL('Anda belum absen masuk hari ini.');
  if (existing.clockOut) return FAIL('Anda sudah absen pulang hari ini.');

  const menitKerja = Math.round((now.getTime() - existing.clockIn.getTime()) / 60000);
  await prisma.attendance.update({
    where: { id: existing.id },
    data: { clockOut: now, workMinutes: menitKerja },
  });

  await audit(session, 'UPDATE', 'Attendance', existing.id, `${session.name} absen pulang`);
  revalidatePath('/me');
  revalidatePath('/attendance');
  const jam = Math.floor(menitKerja / 60);
  return OK(`Absen pulang tercatat. Total kerja ${jam} jam ${menitKerja % 60} menit.`);
}
