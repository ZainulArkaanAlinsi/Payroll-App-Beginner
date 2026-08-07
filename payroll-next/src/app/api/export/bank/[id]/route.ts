import { prisma } from '@/lib/prisma';
import { canManage, getSession } from '@/lib/auth';
import { csvResponse, toCsv } from '@/lib/csv';
import { labelPeriode } from '@/lib/format';

/** Daftar transfer massal — format yang biasa diunggah ke kanal bank korporat. */
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
          bankName: true,
          bankAccount: true,
          bankHolder: true,
        },
      },
    },
    orderBy: { employee: { employeeNo: 'asc' } },
  });

  const berita = `GAJI ${labelPeriode(run.period).toUpperCase()}`;

  const csv = toCsv(
    ['No', 'Nomor Induk', 'Nama Penerima', 'Bank', 'Nomor Rekening', 'Nominal', 'Berita Transfer'],
    items.map((i, n) => [
      n + 1,
      i.employee.employeeNo,
      i.employee.bankHolder ?? i.employee.fullName,
      i.employee.bankName ?? '',
      // rekening dijaga tetap teks agar nol di depan tidak hilang di Excel
      i.employee.bankAccount ? `'${i.employee.bankAccount}` : '',
      i.netPay,
      berita,
    ]),
  );

  return csvResponse(`transfer-bank-${run.period}.csv`, csv);
}
