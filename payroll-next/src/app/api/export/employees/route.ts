import { prisma } from '@/lib/prisma';
import { canManage, getSession } from '@/lib/auth';
import { csvResponse, toCsv } from '@/lib/csv';

export async function GET() {
  const session = await getSession();
  if (!session || !canManage(session.role)) {
    return new Response('Tidak diizinkan', { status: 403 });
  }

  const employees = await prisma.employee.findMany({
    include: { department: { select: { name: true } }, position: { select: { title: true } } },
    orderBy: { employeeNo: 'asc' },
  });

  const csv = toCsv(
    [
      'Nomor Induk', 'Nama Lengkap', 'Surel', 'Telepon', 'NIK', 'NPWP',
      'Departemen', 'Posisi', 'Tanggal Bergabung', 'Jenis Hubungan Kerja',
      'Status', 'Gaji Pokok', 'Status PTKP', 'Bank', 'Nomor Rekening',
    ],
    employees.map((e) => [
      e.employeeNo,
      e.fullName,
      e.email,
      e.phone,
      e.nik,
      e.npwp,
      e.department?.name,
      e.position?.title,
      e.joinDate.toISOString().slice(0, 10),
      e.employmentType,
      e.status,
      e.baseSalary,
      e.ptkpStatus,
      e.bankName,
      e.bankAccount,
    ]),
  );

  return csvResponse(`karyawan-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
