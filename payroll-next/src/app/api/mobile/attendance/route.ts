import { ok, preflight, withEmployee } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const OPTIONS = preflight;

/** Riwayat kehadiran satu bulan. ?month=YYYY-MM, bawaan bulan berjalan. */
export async function GET(req: Request) {
  return withEmployee(req, async (aktor) => {
    const url = new URL(req.url);
    const month = url.searchParams.get('month') ?? new Date().toISOString().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return ok({ month, hari: [], ringkas: {}, totalMenitTelat: 0 });
    }

    const [y, m] = month.split('-').map(Number);
    const awal = new Date(y, m - 1, 1);
    const akhir = new Date(y, m, 1);

    const rows = await prisma.attendance.findMany({
      where: { employeeId: aktor.employeeId, date: { gte: awal, lt: akhir } },
      orderBy: { date: 'asc' },
      select: {
        id: true, date: true, clockIn: true, clockOut: true,
        status: true, lateMinutes: true, workMinutes: true,
      },
    });

    const ringkas: Record<string, number> = {};
    let totalTelat = 0;
    for (const r of rows) {
      ringkas[r.status] = (ringkas[r.status] ?? 0) + 1;
      totalTelat += r.lateMinutes;
    }

    return ok({ month, hari: rows, ringkas, totalMenitTelat: totalTelat });
  });
}
