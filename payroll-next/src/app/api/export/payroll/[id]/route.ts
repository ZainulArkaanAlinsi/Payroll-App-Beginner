import { prisma } from '@/lib/prisma';
import { canManage, getSession } from '@/lib/auth';
import { csvResponse, toCsv } from '@/lib/csv';

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
        select: {
          employeeNo: true,
          fullName: true,
          npwp: true,
          ptkpStatus: true,
          department: { select: { name: true } },
          position: { select: { title: true } },
        },
      },
    },
    orderBy: { employee: { employeeNo: 'asc' } },
  });

  const csv = toCsv(
    [
      'Nomor Induk', 'Nama', 'Departemen', 'Posisi', 'PTKP', 'NPWP',
      'Gaji Pokok', 'Tunjangan Kena Pajak', 'Tunjangan Bebas Pajak', 'Lembur', 'Bruto',
      'BPJS Kesehatan (Karyawan)', 'BPJS JHT (Karyawan)', 'BPJS JP (Karyawan)',
      'Potongan Lain', 'Cicilan Pinjaman', 'Potongan Absen', 'Potongan Telat',
      'Bruto Kena Pajak', 'Tarif', 'Metode Pajak', 'PPh 21',
      'Total Potongan', 'Gaji Bersih',
      'BPJS Kesehatan (Perusahaan)', 'BPJS JHT (Perusahaan)', 'BPJS JP (Perusahaan)',
      'BPJS JKK', 'BPJS JKM', 'Total Biaya Perusahaan',
      'Hari Hadir', 'Hari Cuti', 'Hari Mangkir', 'Jam Lembur',
    ],
    items.map((i) => [
      i.employee.employeeNo,
      i.employee.fullName,
      i.employee.department?.name,
      i.employee.position?.title,
      i.employee.ptkpStatus,
      i.employee.npwp ?? 'TIDAK ADA',
      i.baseSalary, i.allowanceTaxable, i.allowanceNonTax, i.overtimePay, i.grossPay,
      i.bpjsKesEmployee, i.bpjsJhtEmployee, i.bpjsJpEmployee,
      i.otherDeduction, i.loanDeduction, i.unpaidLeaveCut, i.lateCut,
      i.taxableIncome, `${i.terRate}%`, i.taxMethod, i.pph21,
      i.totalDeduction, i.netPay,
      i.bpjsKesEmployer, i.bpjsJhtEmployer, i.bpjsJpEmployer,
      i.bpjsJkkEmployer, i.bpjsJkmEmployer, i.employerCost,
      i.presentDays, i.leaveDays, i.absentDays, i.overtimeHours,
    ]),
  );

  return csvResponse(`payroll-${run.period}.csv`, csv);
}
