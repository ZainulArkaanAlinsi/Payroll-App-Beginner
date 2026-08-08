import { ok, preflight, withEmployee } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { absensiHariIni, sisaKuotaCuti } from '@/lib/self-service';
import { awalBulan } from '@/lib/waktu';

export const OPTIONS = preflight;

/** Segalanya yang dibutuhkan layar beranda, dalam satu permintaan. */
export async function GET(req: Request) {
  return withEmployee(req, async (aktor) => {
    const [emp, hariIni, kuota, slip, cutiTertunda, lemburTertunda] = await Promise.all([
      prisma.employee.findUnique({
        where: { id: aktor.employeeId },
        select: {
          id: true, employeeNo: true, fullName: true, email: true, phone: true,
          joinDate: true, employmentType: true, status: true, ptkpStatus: true,
          bankName: true, bankAccount: true, bankHolder: true,
          department: { select: { name: true } },
          position: { select: { title: true } },
        },
      }),
      absensiHariIni(aktor.employeeId),
      sisaKuotaCuti(aktor.employeeId),
      prisma.payrollItem.findFirst({
        where: { employeeId: aktor.employeeId, run: { status: 'PAID' } },
        orderBy: { run: { period: 'desc' } },
        select: {
          id: true, netPay: true, grossPay: true,
          run: { select: { period: true, label: true, kind: true, payDate: true } },
        },
      }),
      prisma.leaveRequest.count({ where: { employeeId: aktor.employeeId, status: 'PENDING' } }),
      prisma.overtime.count({ where: { employeeId: aktor.employeeId, status: 'PENDING' } }),
    ]);

    if (!emp) return ok(null);

    // Kehadiran bulan berjalan, untuk ditampilkan sebagai rasio.
    const awal = awalBulan();
    const kehadiran = await prisma.attendance.groupBy({
      by: ['status'],
      where: { employeeId: aktor.employeeId, date: { gte: awal } },
      _count: { _all: true },
    });

    return ok({
      profil: emp,
      hariIni,
      kuotaCuti: kuota,
      slipTerakhir: slip,
      tertunda: { cuti: cutiTertunda, lembur: lemburTertunda },
      kehadiranBulanIni: Object.fromEntries(kehadiran.map((k) => [k.status, k._count._all])),
    });
  });
}
