import { bad, ok, preflight, withEmployee } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const OPTIONS = preflight;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withEmployee(req, async (aktor) => {
    const { id } = await params;

    const item = await prisma.payrollItem.findUnique({
      where: { id },
      include: {
        run: {
          select: {
            period: true, label: true, kind: true,
            holidayName: true, payDate: true, status: true,
          },
        },
        employee: {
          select: {
            fullName: true, employeeNo: true, ptkpStatus: true,
            bankName: true, bankAccount: true,
            department: { select: { name: true } },
            position: { select: { title: true } },
          },
        },
      },
    });

    // Pemeriksaan kepemilikan, bukan sekadar mengandalkan id yang sulit ditebak.
    if (!item || item.employeeId !== aktor.employeeId) return bad('Slip tidak ditemukan.', 404);
    if (item.run.status !== 'PAID') return bad('Slip belum diterbitkan.', 403);

    let rincian: unknown = [];
    try {
      rincian = item.breakdown ? JSON.parse(item.breakdown) : [];
    } catch {
      rincian = [];
    }

    const { breakdown: _abaikan, ...sisa } = item;
    return ok({ ...sisa, rincian });
  });
}
