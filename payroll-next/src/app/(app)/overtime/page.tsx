import Link from 'next/link';
import { Timer } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { overtimePay } from '@/lib/payroll-engine';
import { rupiah, rupiahRingkas, sejak, tanggal } from '@/lib/format';
import {
  Avatar, Chip, EmptyState, GlassCard, SectionTitle, StatusChip,
} from '@/components/ui/Glass';
import StatTile from '@/components/ui/StatTile';
import TableToolbar from '@/components/ui/TableToolbar';
import { OvertimeDialog, ReviewOvertime } from './OvertimeControls';

export const metadata = { title: 'Lembur' };

export default async function OvertimePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole('ADMIN', 'HR');
  const sp = await searchParams;
  const q = sp.q?.trim() ?? '';
  const status = sp.status ?? '';

  const [pending, riwayat, employees, ringkas, totalDisetujui] = await Promise.all([
    prisma.overtime.findMany({
      where: { status: 'PENDING' },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            baseSalary: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.overtime.findMany({
      where: {
        status: status ? status : { not: 'PENDING' },
        ...(q ? { employee: { fullName: { contains: q } } } : {}),
      },
      include: {
        employee: { select: { id: true, fullName: true, department: { select: { name: true } } } },
      },
      orderBy: { date: 'desc' },
      take: 40,
    }),
    prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { fullName: 'asc' },
      select: { id: true, fullName: true, employeeNo: true, baseSalary: true },
    }),
    prisma.overtime.groupBy({ by: ['status'], _count: true, _sum: { hours: true } }),
    prisma.overtime.aggregate({ where: { status: 'APPROVED' }, _sum: { amount: true } }),
  ]);

  const jml = (s: string) => ringkas.find((r) => r.status === s)?._count ?? 0;
  const jam = (s: string) => ringkas.find((r) => r.status === s)?._sum.hours ?? 0;

  // Total perkiraan biaya bila seluruh antrean disetujui — angka yang
  // ingin diketahui atasan sebelum mulai menyetujui satu per satu.
  const perkiraanTotal = pending.reduce(
    (t, r) =>
      t +
      overtimePay(r.employee.baseSalary, r.isHoliday ? 0 : r.hours, r.isHoliday ? r.hours : 0).amount,
    0,
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">
            Lembur
          </h1>
          <p className="mt-1 t-small">{pending.length} pengajuan menunggu ditinjau</p>
        </div>
        <OvertimeDialog employees={employees} label="Ajukan atas nama karyawan" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Menunggu" value={String(jml('PENDING'))} sub={`${jam('PENDING')} jam`} />
        <StatTile label="Disetujui" value={String(jml('APPROVED'))} sub={`${jam('APPROVED')} jam`} />
        <StatTile label="Ditolak" value={String(jml('REJECTED'))} />
        <StatTile
          label="Nilai disetujui"
          value={rupiahRingkas(totalDisetujui._sum.amount ?? 0)}
          sub="akumulasi seluruh periode"
        />
      </div>

      <GlassCard>
        <SectionTitle
          title="Menunggu persetujuan"
          subtitle={
            pending.length === 0
              ? undefined
              : `Nilai rupiah dikunci saat disetujui, memakai upah yang berlaku hari itu · perkiraan total ${rupiah(perkiraanTotal)}`
          }
        />
        {pending.length === 0 ? (
          <EmptyState
            icon={<Timer size={18} />}
            title="Tidak ada antrean"
            hint="Semua pengajuan lembur sudah ditinjau."
          />
        ) : (
          <ul className="space-y-2.5">
            {pending.map((r) => {
              const perkiraan = overtimePay(
                r.employee.baseSalary,
                r.isHoliday ? 0 : r.hours,
                r.isHoliday ? r.hours : 0,
              );
              const lama = Math.floor((Date.now() - r.createdAt.getTime()) / 86_400_000);

              return (
                <li key={r.id} className="glass-thin px-4 py-3.5">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto_auto] lg:items-center">
                    <Link href={`/employees/${r.employee.id}`} className="flex items-center gap-2.5">
                      <Avatar name={r.employee.fullName} size={36} />
                      <span className="min-w-0">
                        <span className="block truncate t-small font-semibold" style={{ color: 'var(--text-strong)' }}>
                          {r.employee.fullName}
                        </span>
                        <span className="block truncate t-micro">
                          {r.employee.department?.name ?? '—'}
                        </span>
                        <span
                          className="block t-micro"
                          style={{ color: lama >= 3 ? 'var(--color-brass-500)' : undefined }}
                        >
                          menunggu {sejak(r.createdAt)}
                        </span>
                      </span>
                    </Link>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="tnum t-label font-semibold" style={{ color: 'var(--text-strong)' }}>
                          {r.hours} jam
                        </span>
                        {r.isHoliday && <Chip tone="brass">hari libur</Chip>}
                        <span className="t-micro">{tanggal(r.date)}</span>
                      </div>
                      <p className="mt-1.5 t-small">{r.reason}</p>
                      {/* Rincian pengganda ditampilkan supaya angkanya bisa
                          diperiksa, bukan diterima begitu saja. */}
                      <p className="mt-1 t-micro">{perkiraan.detail.join(' · ')}</p>
                    </div>

                    <div className="lg:text-right">
                      <p className="label !mb-0.5">Perkiraan upah</p>
                      <p className="t-money">{rupiah(perkiraan.amount)}</p>
                    </div>

                    <ReviewOvertime
                      id={r.id}
                      name={r.employee.fullName}
                      estimate={rupiah(perkiraan.amount)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>

      <GlassCard>
        <SectionTitle title="Riwayat pengajuan" subtitle="40 data terbaru" />
        <TableToolbar
          searchPlaceholder="Cari nama karyawan…"
          filters={[
            {
              name: 'status',
              label: 'Semua status',
              options: [
                { value: 'APPROVED', label: 'Disetujui' },
                { value: 'REJECTED', label: 'Ditolak' },
              ],
            },
          ]}
        />

        {riwayat.length === 0 ? (
          <EmptyState title="Tidak ada data yang cocok" />
        ) : (
          <div className="tbl-scroll scroll-slim">
            <table className="tbl" style={{ minWidth: 780 }}>
              <thead>
                <tr>
                  {['Karyawan', 'Tanggal', 'Jam', 'Alasan', 'Nilai', 'Peninjau', 'Status'].map((h, i) => (
                    <th
                      key={h}
                      className={`${
                        i === 2 || i === 4 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {riwayat.map((r) => (
                  <tr
                    key={r.id}
                  >
                    <td>
                      <Link
                        href={`/employees/${r.employee.id}`}
                        className="t-small font-medium"
                        style={{ color: 'var(--text-strong)' }}
                      >
                        {r.employee.fullName}
                      </Link>
                      <span className="block t-micro" style={{ color: 'var(--text-muted)' }}>
                        {r.employee.department?.name ?? '—'}
                      </span>
                    </td>
                    <td className="t-small">
                      {tanggal(r.date)}
                      {r.isHoliday && (
                        <span className="ml-1.5">
                          <Chip tone="brass">libur</Chip>
                        </span>
                      )}
                    </td>
                    <td className="tnum text-right t-small">{r.hours}</td>
                    <td className="max-w-[18rem] t-label">
                      <span className="line-clamp-2">{r.reason}</span>
                    </td>
                    <td
                      className="tnum text-right t-small font-medium"
                      style={{ color: 'var(--text-strong)' }}
                    >
                      {r.amount > 0 ? rupiah(r.amount) : '—'}
                    </td>
                    <td className="t-label" style={{ color: 'var(--text-muted)' }}>
                      {r.reviewedBy ?? '—'}
                    </td>
                    <td>
                      <StatusChip status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
