import { ok, preflight, withEmployee } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const OPTIONS = preflight;

/** Daftar slip gaji milik sendiri. Hanya periode yang sudah dibayarkan. */
export async function GET(req: Request) {
  return withEmployee(req, async (aktor) => {
    const rows = await prisma.payrollItem.findMany({
      where: { employeeId: aktor.employeeId, run: { status: 'PAID' } },
      orderBy: { run: { period: 'desc' } },
      select: {
        id: true, grossPay: true, netPay: true, pph21: true,
        totalDeduction: true, overtimePay: true, thrAmount: true,
        transferStatus: true,
        run: { select: { period: true, label: true, kind: true, holidayName: true, payDate: true } },
      },
    });
    return ok(rows);
  });
}
