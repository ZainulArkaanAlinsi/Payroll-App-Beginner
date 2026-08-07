import { prisma } from '@/lib/prisma';
import { canManage, getSession } from '@/lib/auth';
import { csvResponse, toCsv } from '@/lib/csv';

/** Rekap pemotongan PPh 21 satu masa pajak — bahan penyusunan SPT Masa. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canManage(session.role)) {
    return new Response('Tidak diizinkan', { status: 403 });
  }

  const { id } = await params;
  const run = await prisma.payrollRun.findUnique({ where: { id } });
  if (!run) return new Response('Proses gaji tidak ditemukan', { status: 404 });

  const items = await prisma.payrollItem.findMany({
    where: { runId: id },
    include: {
      employee: {
        select: { employeeNo: true, fullName: true, nik: true, npwp: true, ptkpStatus: true },
      },
    },
    orderBy: { pph21: 'desc' },
  });

  const csv = toCsv(
    [
      'Masa Pajak', 'Nomor Induk', 'Nama', 'NIK', 'NPWP', 'Status PTKP',
      'Penghasilan Bruto', 'Bruto Kena Pajak', 'Tarif Efektif', 'Metode', 'PPh 21 Dipotong',
    ],
    items.map((i) => [
      run.period,
      i.employee.employeeNo,
      i.employee.fullName,
      i.employee.nik,
      i.employee.npwp ?? 'TIDAK ADA',
      i.employee.ptkpStatus,
      i.grossPay,
      i.taxableIncome,
      `${i.terRate}%`,
      i.taxMethod === 'TER' ? 'TER (PP 58/2023)' : 'Progresif Pasal 17',
      i.pph21,
    ]),
  );

  return csvResponse(`rekap-pph21-${run.period}.csv`, csv);
}
