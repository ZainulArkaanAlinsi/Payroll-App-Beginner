import Link from 'next/link';
import { ChevronRight, Download, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rupiah, tanggal } from '@/lib/format';
import { Avatar, Chip, EmptyState, GlassCard, StatusChip } from '@/components/ui/Glass';
import TableToolbar from '@/components/ui/TableToolbar';
import EmployeeDialog from './EmployeeDialog';

export const metadata = { title: 'Karyawan' };

const PAGE_SIZE = 15;

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole('ADMIN', 'HR');
  const sp = await searchParams;

  const q = sp.q?.trim() ?? '';
  const dept = sp.dept ?? '';
  const status = sp.status ?? '';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  const where = {
    ...(q
      ? {
          OR: [
            { fullName: { contains: q } },
            { employeeNo: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {}),
    ...(dept ? { departmentId: dept } : {}),
    ...(status ? { status } : {}),
  };

  const [employees, total, departments, positions, ringkas] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: {
        department: { select: { name: true } },
        position: { select: { title: true, level: true } },
      },
      orderBy: [{ status: 'asc' }, { fullName: 'asc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.employee.count({ where }),
    prisma.department.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.position.findMany({
      orderBy: { title: 'asc' },
      select: { id: true, title: true, departmentId: true, minSalary: true, maxSalary: true },
    }),
    prisma.employee.groupBy({ by: ['status'], _count: true }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const jml = (s: string) => ringkas.find((r) => r.status === s)?._count ?? 0;

  const qs = (patch: Record<string, string>) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (dept) p.set('dept', dept);
    if (status) p.set('status', status);
    for (const [k, v] of Object.entries(patch)) v ? p.set(k, v) : p.delete(k);
    return `?${p.toString()}`;
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="t-display">
            Karyawan
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 t-small">
            <span>{total} data ditemukan</span>
            <Chip tone="jade">{jml('ACTIVE')} aktif</Chip>
            {jml('RESIGNED') > 0 && <Chip tone="clay">{jml('RESIGNED')} keluar</Chip>}
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/employees" className="btn btn-ghost btn-sm">
            <Download size={14} />
            Ekspor CSV
          </a>
          <EmployeeDialog departments={departments} positions={positions} />
        </div>
      </div>

      <GlassCard>
        <TableToolbar
          searchPlaceholder="Cari nama, nomor induk, atau surel…"
          filters={[
            {
              name: 'dept',
              label: 'Semua departemen',
              options: departments.map((d) => ({ value: d.id, label: d.name })),
            },
            {
              name: 'status',
              label: 'Semua status',
              options: [
                { value: 'ACTIVE', label: 'Aktif' },
                { value: 'ON_LEAVE', label: 'Cuti panjang' },
                { value: 'RESIGNED', label: 'Mengundurkan diri' },
                { value: 'TERMINATED', label: 'Diberhentikan' },
              ],
            },
          ]}
        />

        {employees.length === 0 ? (
          <EmptyState
            icon={<Users size={18} />}
            title="Tidak ada karyawan yang cocok"
            hint="Coba ubah kata kunci atau bersihkan penyaring."
          />
        ) : (
          <div className="scroll-slim -mx-1 overflow-x-auto">
            <table className="w-full min-w-[820px] t-body">
              <thead>
                <tr style={{ color: 'var(--text-muted)' }}>
                  {['Karyawan', 'Departemen', 'Posisi', 'Bergabung', 'Gaji pokok', 'PTKP', 'Status', ''].map(
                    (h, i) => (
                      <th
                        key={h || i}
                        className={`px-2 pb-2 t-micro font-semibold tracking-wide uppercase ${
                          i === 4 ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr
                    key={e.id}
                    className="transition-colors hover:bg-[var(--field-bg)]"
                    style={{ borderTop: '1px solid var(--hairline)' }}
                  >
                    <td className="px-2 py-2.5">
                      <Link href={`/employees/${e.id}`} className="flex items-center gap-2.5">
                        <Avatar name={e.fullName} size={32} />
                        <span className="min-w-0">
                          <span
                            className="block truncate font-medium"
                            style={{ color: 'var(--text-strong)' }}
                          >
                            {e.fullName}
                          </span>
                          <span
                            className="tnum block truncate t-micro"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {e.employeeNo} · {e.email}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-2 py-2.5 t-small">{e.department?.name ?? '—'}</td>
                    <td className="px-2 py-2.5 t-small">{e.position?.title ?? '—'}</td>
                    <td className="px-2 py-2.5 t-small">{tanggal(e.joinDate)}</td>
                    <td
                      className="tnum px-2 py-2.5 text-right t-small font-medium"
                      style={{ color: 'var(--text-strong)' }}
                    >
                      {rupiah(e.baseSalary)}
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="tnum t-label">{e.ptkpStatus}</span>
                      {!e.npwp && (
                        <span className="ml-1.5">
                          <Chip tone="brass">tanpa NPWP</Chip>
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2.5">
                      <StatusChip status={e.status} />
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <Link
                        href={`/employees/${e.id}`}
                        className="inline-flex items-center"
                        style={{ color: 'var(--text-muted)' }}
                        aria-label={`Lihat detail ${e.fullName}`}
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div
            className="mt-4 flex items-center justify-between border-t pt-3 t-label"
            style={{ borderColor: 'var(--hairline)' }}
          >
            <span style={{ color: 'var(--text-muted)' }}>
              Halaman {page} dari {pages}
            </span>
            <div className="flex gap-2">
              <Link
                href={qs({ page: String(page - 1) })}
                className="btn btn-ghost btn-sm"
                style={{ pointerEvents: page <= 1 ? 'none' : undefined, opacity: page <= 1 ? 0.4 : 1 }}
              >
                Sebelumnya
              </Link>
              <Link
                href={qs({ page: String(page + 1) })}
                className="btn btn-ghost btn-sm"
                style={{
                  pointerEvents: page >= pages ? 'none' : undefined,
                  opacity: page >= pages ? 0.4 : 1,
                }}
              >
                Berikutnya
              </Link>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
