import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { labelPeriode, rupiah } from '@/lib/format';
import {
  Avatar, EmptyState, GlassCard, SectionTitle, StatusChip,
} from '@/components/ui/Glass';
import TableToolbar from '@/components/ui/TableToolbar';

export const metadata = { title: 'Slip Gaji' };

const PAGE_SIZE = 25;

export default async function PayslipsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole('ADMIN', 'HR');
  const sp = await searchParams;
  const q = sp.q?.trim() ?? '';
  const runId = sp.run ?? '';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  const where = {
    ...(runId ? { runId } : {}),
    ...(q
      ? {
          employee: {
            OR: [{ fullName: { contains: q } }, { employeeNo: { contains: q } }],
          },
        }
      : {}),
  };

  const [items, total, runs] = await Promise.all([
    prisma.payrollItem.findMany({
      where,
      include: {
        run: { select: { id: true, period: true, status: true } },
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeNo: true,
            department: { select: { name: true } },
            position: { select: { title: true } },
          },
        },
      },
      orderBy: [{ run: { period: 'desc' } }, { netPay: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.payrollItem.count({ where }),
    prisma.payrollRun.findMany({ orderBy: { period: 'desc' }, select: { id: true, period: true } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => {
    const s = new URLSearchParams();
    if (q) s.set('q', q);
    if (runId) s.set('run', runId);
    s.set('page', String(p));
    return `?${s.toString()}`;
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <div>
        <h1 className="t-display">
          Slip gaji
        </h1>
        <p className="mt-1 t-small">{total} slip tersimpan di arsip</p>
      </div>

      <GlassCard>
        <SectionTitle title="Arsip slip" subtitle="Klik baris untuk membuka slip yang bisa dicetak" />
        <TableToolbar
          searchPlaceholder="Cari nama atau nomor induk…"
          filters={[
            {
              name: 'run',
              label: 'Semua periode',
              options: runs.map((r) => ({ value: r.id, label: labelPeriode(r.period) })),
            },
          ]}
        />

        {items.length === 0 ? (
          <EmptyState
            icon={<Receipt size={18} />}
            title="Tidak ada slip yang cocok"
            hint="Slip terbit setelah proses gaji dihitung."
          />
        ) : (
          <div className="scroll-slim -mx-1 overflow-x-auto">
            <table className="w-full min-w-[880px] t-body">
              <thead>
                <tr style={{ color: 'var(--text-muted)' }}>
                  {['Karyawan', 'Periode', 'Status', 'Bruto', 'PPh 21', 'Potongan', 'Diterima', ''].map(
                    (h, i) => (
                      <th
                        key={h || i}
                        className={`px-2 pb-2 t-micro font-semibold tracking-wide uppercase ${
                          i >= 3 && i <= 6 ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr
                    key={it.id}
                    className="transition-colors hover:bg-[var(--field-bg)]"
                    style={{ borderTop: '1px solid var(--hairline)' }}
                  >
                    <td className="px-2 py-2.5">
                      <Link href={`/employees/${it.employee.id}`} className="flex items-center gap-2.5">
                        <Avatar name={it.employee.fullName} size={28} />
                        <span className="min-w-0">
                          <span
                            className="block truncate t-small font-medium"
                            style={{ color: 'var(--text-strong)' }}
                          >
                            {it.employee.fullName}
                          </span>
                          <span
                            className="block truncate t-micro"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {it.employee.employeeNo} · {it.employee.position?.title ?? '—'}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-2 py-2.5 t-small">{labelPeriode(it.run.period)}</td>
                    <td className="px-2 py-2.5">
                      <StatusChip status={it.run.status} />
                    </td>
                    <td className="tnum px-2 py-2.5 text-right t-small">{rupiah(it.grossPay)}</td>
                    <td
                      className="tnum px-2 py-2.5 text-right t-small"
                      style={{ color: 'var(--color-clay-500)' }}
                    >
                      −{rupiah(it.pph21)}
                    </td>
                    <td
                      className="tnum px-2 py-2.5 text-right t-small"
                      style={{ color: 'var(--color-clay-500)' }}
                    >
                      −{rupiah(it.totalDeduction)}
                    </td>
                    <td
                      className="tnum px-2 py-2.5 text-right t-small font-semibold"
                      style={{ color: 'var(--text-strong)' }}
                    >
                      {rupiah(it.netPay)}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <Link href={`/payslip/${it.id}`} className="btn btn-ghost btn-sm">
                        Buka slip
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
                href={qs(page - 1)}
                className="btn btn-ghost btn-sm"
                style={{ pointerEvents: page <= 1 ? 'none' : undefined, opacity: page <= 1 ? 0.4 : 1 }}
              >
                Sebelumnya
              </Link>
              <Link
                href={qs(page + 1)}
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
