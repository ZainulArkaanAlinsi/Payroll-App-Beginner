import { bad, jsonBody, ok, preflight, withEmployee } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { ajukanCuti, sisaKuotaCuti, type InputCuti } from '@/lib/self-service';

export const OPTIONS = preflight;

export async function GET(req: Request) {
  return withEmployee(req, async (aktor) => {
    const [daftar, kuota] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: { employeeId: aktor.employeeId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true, type: true, startDate: true, endDate: true, days: true,
          reason: true, status: true, reviewNote: true, reviewedBy: true, createdAt: true,
        },
      }),
      sisaKuotaCuti(aktor.employeeId),
    ]);
    return ok({ daftar, kuota });
  });
}

export async function POST(req: Request) {
  return withEmployee(req, async (aktor) => {
    const body = await jsonBody<Partial<InputCuti>>(req);
    if (!body) return bad('Isian tidak terbaca.');

    const hasil = await ajukanCuti(aktor, {
      employeeId: aktor.employeeId,
      type: (body.type ?? 'ANNUAL') as InputCuti['type'],
      startDate: body.startDate ?? '',
      endDate: body.endDate ?? '',
      reason: body.reason ?? '',
    });

    if (!hasil.ok) return bad(hasil.error ?? 'Pengajuan gagal.');
    return ok({ pesan: hasil.message });
  });
}
