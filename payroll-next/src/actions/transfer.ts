'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { audit, requireRole } from '@/lib/auth';
import { FAIL, OK, type ActionState } from '@/lib/types';
import { labelPeriode } from '@/lib/format';

const SAH = ['PENDING', 'SENT', 'FAILED', 'HOLD'] as const;
type StatusTransfer = (typeof SAH)[number];

/** Menandai hasil transfer satu karyawan setelah berkas diproses bank. */
export async function tandaiTransfer(
  itemId: string,
  status: StatusTransfer,
  catatan?: string,
): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');
  if (!SAH.includes(status)) return FAIL('Status transfer tidak dikenal.');

  const item = await prisma.payrollItem.findUnique({
    where: { id: itemId },
    include: { employee: { select: { fullName: true } }, run: { select: { id: true, period: true, status: true } } },
  });
  if (!item) return FAIL('Baris gaji tidak ditemukan.');
  if (item.run.status !== 'PAID' && status === 'SENT') {
    return FAIL('Tandai periodenya dibayarkan lebih dulu sebelum mencatat hasil transfer.');
  }

  await prisma.payrollItem.update({
    where: { id: itemId },
    data: {
      transferStatus: status,
      transferNote: catatan || null,
      transferredAt: status === 'SENT' ? new Date() : null,
    },
  });

  await audit(
    session,
    'UPDATE',
    'PayrollItem',
    itemId,
    `Transfer ${item.employee.fullName} ditandai ${status.toLowerCase()}`,
  );
  revalidatePath(`/payroll/${item.run.id}`);
  return OK(`Transfer ${item.employee.fullName} ditandai ${status === 'SENT' ? 'berhasil' : status.toLowerCase()}.`);
}

/**
 * Menandai seluruh baris yang belum dikirim sebagai berhasil.
 * Dipakai setelah bank mengonfirmasi berkasnya diproses penuh; baris yang
 * sudah ditandai gagal sengaja tidak ikut tersapu.
 */
export async function tandaiSemuaTerkirim(runId: string): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');

  const run = await prisma.payrollRun.findUnique({ where: { id: runId } });
  if (!run) return FAIL('Proses gaji tidak ditemukan.');
  if (run.status !== 'PAID') {
    return FAIL('Tandai periodenya dibayarkan lebih dulu.');
  }

  const hasil = await prisma.payrollItem.updateMany({
    where: { runId, transferStatus: 'PENDING' },
    data: { transferStatus: 'SENT', transferredAt: new Date() },
  });

  if (hasil.count === 0) return OK('Tidak ada baris yang menunggu — semuanya sudah ditandai.');

  await audit(
    session,
    'UPDATE',
    'PayrollRun',
    runId,
    `${hasil.count} transfer ${labelPeriode(run.period)} ditandai berhasil`,
  );
  revalidatePath(`/payroll/${runId}`);
  return OK(`${hasil.count} transfer ditandai berhasil.`);
}

/** Mengembalikan baris yang gagal ke antrean supaya bisa dikirim ulang. */
export async function ulangiTransferGagal(runId: string): Promise<ActionState> {
  const session = await requireRole('ADMIN', 'HR');

  const hasil = await prisma.payrollItem.updateMany({
    where: { runId, transferStatus: 'FAILED' },
    data: { transferStatus: 'PENDING', transferredAt: null },
  });

  if (hasil.count === 0) return FAIL('Tidak ada transfer gagal pada periode ini.');

  await audit(session, 'UPDATE', 'PayrollRun', runId, `${hasil.count} transfer gagal dikembalikan ke antrean`);
  revalidatePath(`/payroll/${runId}`);
  return OK(`${hasil.count} baris dikembalikan ke antrean. Ekspor ulang berkas transfernya.`);
}
