import { bad, jsonBody, ok, preflight, withEmployee } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { ajukanLembur, perkiraanLembur } from '@/lib/self-service';

export const OPTIONS = preflight;

export async function GET(req: Request) {
  return withEmployee(req, async (aktor) => {
    const daftar = await prisma.overtime.findMany({
      where: { employeeId: aktor.employeeId },
      orderBy: { date: 'desc' },
      take: 50,
      select: {
        id: true, date: true, hours: true, isHoliday: true, reason: true,
        status: true, amount: true, reviewedBy: true, createdAt: true,
      },
    });
    return ok({ daftar });
  });
}

export async function POST(req: Request) {
  return withEmployee(req, async (aktor) => {
    const body = await jsonBody<{
      date?: string; hours?: number; reason?: string; perkiraanSaja?: boolean;
    }>(req);
    if (!body) return bad('Isian tidak terbaca.');

    const jam = Number(body.hours ?? 0);
    const tgl = body.date ?? '';

    // Karyawan boleh melihat perkiraan rupiahnya sebelum benar-benar mengirim.
    if (body.perkiraanSaja) {
      if (!tgl || !(jam > 0)) return ok({ perkiraan: 0 });
      return ok({ perkiraan: await perkiraanLembur(aktor.employeeId, jam, tgl) });
    }

    const hasil = await ajukanLembur(aktor, {
      employeeId: aktor.employeeId,
      date: tgl,
      hours: jam,
      reason: body.reason ?? '',
    });

    if (!hasil.ok) return bad(hasil.error ?? 'Pengajuan gagal.');
    return ok({ pesan: hasil.message });
  });
}
