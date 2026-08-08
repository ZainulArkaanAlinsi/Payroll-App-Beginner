'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { audit, canManage, notify, requireRole, requireSession } from '@/lib/auth';
import { FAIL, OK, type ActionState } from '@/lib/types';

import { absen, ajukanCuti, ajukanLembur, nilaiLembur, type InputCuti } from '@/lib/self-service';

// ───────────────────────────── Cuti ─────────────────────────────

export async function submitLeave(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = await requireSession();

  const hasil = await ajukanCuti(session, {
    employeeId: String(fd.get('employeeId') ?? ''),
    type: String(fd.get('type') ?? 'ANNUAL') as InputCuti['type'],
    startDate: String(fd.get('startDate') ?? ''),
    endDate: String(fd.get('endDate') ?? ''),
    reason: String(fd.get('reason') ?? ''),
  });

  if (hasil.ok) {
    revalidatePath('/leave');
    revalidatePath('/me');
  }
  return hasil;
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

export async function submitOvertime(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = await requireSession();

  const hasil = await ajukanLembur(session, {
    employeeId: String(fd.get('employeeId') ?? ''),
    date: String(fd.get('date') ?? ''),
    hours: Number(String(fd.get('hours') ?? '0').replace(',', '.')),
    reason: String(fd.get('reason') ?? ''),
  });

  if (hasil.ok) {
    revalidatePath('/overtime');
    revalidatePath('/me');
  }
  return hasil;
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

  // Nilai rupiah dikunci saat persetujuan, memakai upah yang berlaku saat itu
  // — kenaikan gaji nanti tidak mengubah lembur yang lampau.
  //
  // Dasarnya gaji pokok ditambah tunjangan tetap, sama persis dengan yang
  // dipakai mesin gaji. Sebelumnya di sini hanya gaji pokok, sehingga angka
  // yang disebut saat menyetujui lebih kecil daripada yang dibayarkan.
  const { amount } =
    decision === 'APPROVED'
      ? await nilaiLembur(req.employeeId, req.hours, req.isHoliday)
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
  const hasil = await absen(session, kind);
  if (hasil.ok) {
    revalidatePath('/me');
    revalidatePath('/attendance');
  }
  return hasil;
}
