import Link from 'next/link';
import { Palmtree } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sejak, tanggal } from '@/lib/format';
import {
  Avatar, Chip, EmptyState, GlassCard, SectionTitle, StatusChip, statusLabel,
} from '@/components/ui/Glass';
import StatTile from '@/components/ui/StatTile';
import TableToolbar from '@/components/ui/TableToolbar';
import { LeaveDialog, ReviewLeave } from './LeaveControls';

export const metadata = { title: 'Cuti' };

export default async function LeavePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole('ADMIN', 'HR');
  const sp = await searchParams;
  const q = sp.q?.trim() ?? '';
  const status = sp.status ?? '';
  const type = sp.type ?? '';

  const [pending, riwayat, employees, ringkas] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeNo: true,
            annualLeaveQuota: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.leaveRequest.findMany({
      where: {
        status: status ? status : { not: 'PENDING' },
        ...(type ? { type } : {}),
        ...(q ? { employee: { fullName: { contains: q } } } : {}),
      },
      include: {
        employee: { select: { id: true, fullName: true, department: { select: { name: true } } } },
      },
      orderBy: { startDate: 'desc' },
      take: 40,
    }),
    prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { fullName: 'asc' },
      select: { id: true, fullName: true, employeeNo: true },
    }),
    prisma.leaveRequest.groupBy({ by: ['status'], _count: true, _sum: { days: true } }),
  ]);

  const jml = (s: string) => ringkas.find((r) => r.status === s)?._count ?? 0;
  const hari = (s: string) => ringkas.find((r) => r.status === s)?._sum.days ?? 0;

  // sisa kuota tahun berjalan untuk tiap pemohon yang menunggu
  const tahun = new Date().getFullYear();
  const terpakai = await prisma.leaveRequest.groupBy({
    by: ['employeeId'],
    where: {
      type: 'ANNUAL',
      status: 'APPROVED',
      startDate: { gte: new Date(tahun, 0, 1) },
    },
    _sum: { days: true },
  });
  const pakaiMap = new Map(terpakai.map((t) => [t.employeeId, t._sum.days ?? 0]));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">
            Cuti
          </h1>
          <p className="mt-1 t-small">
            {pending.length} pengajuan menunggu ditinjau
          </p>
        </div>
        <LeaveDialog employees={employees} label="Ajukan atas nama karyawan" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Menunggu" value={String(jml('PENDING'))} sub="perlu ditinjau" />
        <StatTile label="Disetujui" value={String(jml('APPROVED'))} sub={`${hari('APPROVED')} hari total`} />
        <StatTile label="Ditolak" value={String(jml('REJECTED'))} />
        <StatTile label="Dibatalkan" value={String(jml('CANCELLED'))} />
      </div>

      {/* ── antrean persetujuan ── */}
      <GlassCard>
        <SectionTitle
          title="Menunggu persetujuan"
          subtitle="Diurutkan dari pengajuan paling lama"
        />
        {pending.length === 0 ? (
          <EmptyState
            icon={<Palmtree size={18} />}
            title="Tidak ada antrean"
            hint="Semua pengajuan cuti sudah ditinjau."
          />
        ) : (
          <ul className="space-y-2">
            {pending.map((r) => {
              const sisa = r.employee.annualLeaveQuota - (pakaiMap.get(r.employeeId) ?? 0);
              const melebihi = r.type === 'ANNUAL' && r.days > sisa;
              return (
                <li key={r.id}>
                  <div className="glass-thin flex flex-wrap items-center gap-4 px-4 py-3">
                    <Link href={`/employees/${r.employee.id}`} className="flex min-w-[13rem] items-center gap-2.5">
                      <Avatar name={r.employee.fullName} size={34} />
                      <span className="min-w-0">
                        <span
                          className="block truncate t-body font-medium"
                          style={{ color: 'var(--text-strong)' }}
                        >
                          {r.employee.fullName}
                        </span>
                        <span className="block truncate t-micro" style={{ color: 'var(--text-muted)' }}>
                          {r.employee.department?.name ?? '—'} · diajukan {sejak(r.createdAt)}
                        </span>
                      </span>
                    </Link>

                    <div className="min-w-[11rem]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Chip tone="info">{statusLabel(r.type)}</Chip>
                        <span className="tnum t-label font-semibold" style={{ color: 'var(--text-strong)' }}>
                          {r.days} hari
                        </span>
                        {melebihi && <Chip tone="clay">melebihi kuota</Chip>}
                      </div>
                      <p className="mt-0.5 t-micro" style={{ color: 'var(--text-muted)' }}>
                        {tanggal(r.startDate)} – {tanggal(r.endDate)}
                        {r.type === 'ANNUAL' && ` · sisa kuota ${sisa} hari`}
                      </p>
                    </div>

                    <p className="min-w-[12rem] flex-1 t-label">{r.reason}</p>

                    <ReviewLeave id={r.id} name={r.employee.fullName} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>

      {/* ── riwayat ── */}
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
                { value: 'CANCELLED', label: 'Dibatalkan' },
              ],
            },
            {
              name: 'type',
              label: 'Semua jenis',
              options: [
                { value: 'ANNUAL', label: 'Cuti tahunan' },
                { value: 'SICK', label: 'Sakit' },
                { value: 'UNPAID', label: 'Di luar tanggungan' },
                { value: 'MATERNITY', label: 'Melahirkan' },
                { value: 'SPECIAL', label: 'Khusus' },
              ],
            },
          ]}
        />

        {riwayat.length === 0 ? (
          <EmptyState title="Tidak ada data yang cocok" />
        ) : (
          <div className="tbl-scroll scroll-slim">
            <table className="tbl" style={{ minWidth: 820 }}>
              <thead>
                <tr>
                  {['Karyawan', 'Jenis', 'Tanggal', 'Hari', 'Alasan', 'Peninjau', 'Status'].map((h, i) => (
                    <th
                      key={h}
                      className={`${
                        i === 3 ? 'text-right' : 'text-left'
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
                    <td className="t-small">{statusLabel(r.type)}</td>
                    <td className="t-small">
                      {tanggal(r.startDate)} – {tanggal(r.endDate)}
                    </td>
                    <td className="tnum text-right t-small">{r.days}</td>
                    <td className="max-w-[16rem] t-label">
                      <span className="line-clamp-2">{r.reason}</span>
                      {r.reviewNote && (
                        <span className="block t-micro" style={{ color: 'var(--color-clay-500)' }}>
                          Catatan: {r.reviewNote}
                        </span>
                      )}
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
