import Link from 'next/link';
import {
  ArrowRight, Banknote, CalendarCheck, ChevronRight, CircleAlert,
  Palmtree, Timer, TrendingUp, Users, Wallet,
} from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { companyOverview, costByDepartment, costTerrain, deductionBreakdown } from '@/lib/analytics';
import { labelPeriode, periodeSekarang, rupiah, rupiahRingkas, sejak, tanggal } from '@/lib/format';
import { GlassCard, SectionTitle, StatusChip, Chip, Avatar, EmptyState } from '@/components/ui/Glass';
import StatTile from '@/components/ui/StatTile';
import { BarRank, Donut, LineChart, Sparkline } from '@/components/ui/charts';
import TerrainPanel from '@/components/three/TerrainPanel';

export const metadata = { title: 'Dasbor' };

export default async function DashboardPage() {
  const session = await requireRole('ADMIN', 'HR');
  const o = await companyOverview();

  const [byDept, deductions, terrain, activity, topEarners, currentRun] = await Promise.all([
    o.latest ? costByDepartment(o.latest.id) : Promise.resolve([]),
    o.latest ? deductionBreakdown(o.latest.id) : Promise.resolve([]),
    costTerrain(4),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 6 }),
    o.latest
      ? prisma.payrollItem.findMany({
          where: { runId: o.latest.id },
          orderBy: { netPay: 'desc' },
          take: 5,
          select: {
            id: true,
            netPay: true,
            grossPay: true,
            employee: { select: { id: true, fullName: true, position: { select: { title: true } } } },
          },
        })
      : Promise.resolve([]),
    prisma.payrollRun.findUnique({ where: { period: periodeSekarang() } }),
  ]);

  const pct = (now: number, before: number) => (before > 0 ? ((now - before) / before) * 100 : null);

  const netDelta = o.latest && o.previous ? pct(o.latest.totalNet, o.previous.totalNet) : null;
  const costDelta =
    o.latest && o.previous ? pct(o.latest.totalEmployerCost, o.previous.totalEmployerCost) : null;
  const taxDelta = o.latest && o.previous ? pct(o.latest.totalTax, o.previous.totalTax) : null;

  const trendValues = o.runs.map((r) => r.totalNet);
  const pendingTotal = o.pendingLeave + o.pendingOvertime;

  return (
    <div className="page">
      {/* ── kepala halaman ── */}
      <div className="page-head">
        <div>
          <p className="label !mb-1">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="t-display">
            Selamat datang, {session.name.split(' ')[0]}
          </h1>
          <p className="mt-1 t-small">
            {o.latest
              ? `Proses gaji terakhir: ${labelPeriode(o.latest.period)} · ${o.latest.headcount} karyawan`
              : 'Belum ada proses gaji yang diselesaikan.'}
          </p>
        </div>

        <div className="page-head-actions">
          {pendingTotal > 0 && (
            <Link href="/leave" className="btn btn-ghost btn-sm">
              <CircleAlert size={14} style={{ color: 'var(--color-brass-500)' }} />
              {pendingTotal} menunggu persetujuan
            </Link>
          )}
          <Link href="/payroll" className="btn btn-primary btn-sm">
            <Wallet size={14} />
            Kelola proses gaji
          </Link>
        </div>
      </div>

      {/* ── peringatan periode berjalan ── */}
      {!currentRun && (
        <GlassCard
          className="flex flex-wrap items-center justify-between gap-4"
          style={{ borderColor: 'color-mix(in srgb, var(--color-brass-500) 32%, transparent)' }}
        >
          <div className="flex items-start gap-3">
            <CircleAlert size={18} className="mt-px shrink-0" style={{ color: 'var(--color-brass-500)' }} />
            <div>
              <p className="t-body font-semibold" style={{ color: 'var(--text-strong)' }}>
                Periode {labelPeriode(periodeSekarang())} belum diproses
              </p>
              <p className="mt-0.5 t-small">
                Buat proses gaji baru agar kehadiran dan lembur bulan ini ikut terhitung.
              </p>
            </div>
          </div>
          <Link href="/payroll" className="btn btn-primary btn-sm shrink-0">
            Buat sekarang
            <ArrowRight size={14} />
          </Link>
        </GlassCard>
      )}

      {/* ── kartu angka ── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Gaji dibayarkan"
          value={rupiahRingkas(o.latest?.totalNet ?? 0)}
          sub={o.latest ? labelPeriode(o.latest.period) : '—'}
          delta={netDelta}
          icon={<Banknote size={14} />}
          chart={trendValues.length > 1 ? <Sparkline values={trendValues} /> : undefined}
        />
        <StatTile
          label="Biaya perusahaan"
          value={rupiahRingkas(o.latest?.totalEmployerCost ?? 0)}
          sub="termasuk BPJS pemberi kerja"
          delta={costDelta}
          invertDelta
          icon={<TrendingUp size={14} />}
          chart={
            o.runs.length > 1 ? (
              <Sparkline values={o.runs.map((r) => r.totalEmployerCost)} tone="var(--series-5)" />
            ) : undefined
          }
        />
        <StatTile
          label="PPh 21 dipotong"
          value={rupiahRingkas(o.latest?.totalTax ?? 0)}
          sub="disetor ke kas negara"
          delta={taxDelta}
          invertDelta
          icon={<Wallet size={14} />}
          chart={
            o.runs.length > 1 ? (
              <Sparkline values={o.runs.map((r) => r.totalTax)} tone="var(--series-3)" />
            ) : undefined
          }
        />
        <StatTile
          label="Karyawan aktif"
          value={String(o.headcount)}
          sub={`rata-rata ${rupiahRingkas(o.avgSalary)}`}
          icon={<Users size={14} />}
        />
      </div>

      {/* ── grafik utama ── */}
      <div className="grid gap-3 xl:grid-cols-3">
        <GlassCard className="xl:col-span-2">
          <SectionTitle
            title="Tren gaji bersih dibayarkan"
            subtitle="Total take home pay seluruh karyawan per periode"
          />
          {o.trend.length > 1 ? (
            <LineChart data={o.trend} height={210} />
          ) : (
            <EmptyState title="Butuh minimal dua periode" hint="Jalankan proses gaji beberapa bulan untuk melihat tren." />
          )}
        </GlassCard>

        <GlassCard>
          <SectionTitle
            title="Komposisi potongan"
            subtitle={o.latest ? labelPeriode(o.latest.period) : '—'}
          />
          {deductions.length > 0 ? (
            <Donut
              data={deductions}
              centerLabel="Total potongan"
              centerValue={rupiahRingkas(deductions.reduce((s, d) => s + d.value, 0))}
              format="ringkas"
            />
          ) : (
            <EmptyState title="Belum ada data potongan" />
          )}
        </GlassCard>
      </div>

      {/* ── bentang biaya 3D ── */}
      <GlassCard className="overflow-hidden">
        <SectionTitle
          title="Bentang biaya per departemen"
          subtitle="Tinggi balok = biaya perusahaan · sumbu horizontal = departemen · sumbu kedalaman = periode"
          action={<Chip tone="info">3D · interaktif</Chip>}
        />
        <div className="-mx-2 h-[340px] sm:h-[400px]">
          {terrain.cells.length > 0 ? (
            <TerrainPanel
              cells={terrain.cells}
              departments={terrain.departments}
              periods={terrain.periods}
            />
          ) : (
            <EmptyState title="Belum ada proses gaji" hint="Visualisasi muncul setelah ada periode yang disetujui." />
          )}
        </div>
        {/* legenda tekstual — identitas departemen tidak bergantung warna saja */}
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t pt-3" style={{ borderColor: 'var(--hairline)' }}>
          {terrain.departments.map((d, i) => (
            <li key={d} className="flex items-center gap-1.5 t-micro" style={{ color: 'var(--text-body)' }}>
              <span className="size-2 rounded-[3px]" style={{ background: `var(--series-${(i % 6) + 1})` }} aria-hidden />
              {d}
            </li>
          ))}
        </ul>
      </GlassCard>

      {/* ── baris bawah ── */}
      <div className="grid gap-3 xl:grid-cols-3">
        <GlassCard>
          <SectionTitle
            title="Biaya per departemen"
            subtitle={o.latest ? labelPeriode(o.latest.period) : '—'}
            action={
              <Link href="/reports" className="t-micro" style={{ color: 'var(--accent)' }}>
                Laporan
              </Link>
            }
          />
          {byDept.length > 0 ? (
            <BarRank
              colored
              data={byDept.map((d, i) => ({
                label: d.name,
                value: d.cost,
                colorIndex: i,
                sub: `${d.count} karyawan`,
              }))}
            />
          ) : (
            <EmptyState title="Belum ada data" />
          )}
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Penerimaan tertinggi" subtitle="Gaji bersih periode terakhir" />
          {topEarners.length > 0 ? (
            <ul className="space-y-1">
              {topEarners.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/employees/${t.employee.id}`}
                    className="flex items-center gap-3 rounded-[10px] transition-colors hover:bg-[var(--field-bg)]"
                  >
                    <Avatar name={t.employee.fullName} size={30} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate t-small font-medium"
                        style={{ color: 'var(--text-strong)' }}
                      >
                        {t.employee.fullName}
                      </span>
                      <span className="block truncate t-micro" style={{ color: 'var(--text-muted)' }}>
                        {t.employee.position?.title ?? '—'}
                      </span>
                    </span>
                    <span className="tnum shrink-0 t-small font-semibold" style={{ color: 'var(--text-strong)' }}>
                      {rupiahRingkas(t.netPay)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Belum ada slip gaji" />
          )}
        </GlassCard>

        <div className="space-y-3">
          <GlassCard>
            <SectionTitle title="Butuh perhatian" />
            <ul className="space-y-2">
              <PendingRow
                href="/leave"
                icon={<Palmtree size={14} />}
                label="Pengajuan cuti"
                count={o.pendingLeave}
              />
              <PendingRow
                href="/overtime"
                icon={<Timer size={14} />}
                label="Pengajuan lembur"
                count={o.pendingOvertime}
              />
              <PendingRow
                href="/attendance"
                icon={<CalendarCheck size={14} />}
                label={`Kehadiran ${labelPeriode(periodeSekarang())}`}
                count={null}
                right={`${o.attendanceRate.toFixed(1)}%`}
              />
            </ul>
          </GlassCard>

          <GlassCard>
            <SectionTitle
              title="Aktivitas terakhir"
              action={
                <Link href="/audit" className="t-micro" style={{ color: 'var(--accent)' }}>
                  Semua
                </Link>
              }
            />
            <ul className="space-y-2.5">
              {activity.map((a) => (
                <li key={a.id} className="flex gap-2.5">
                  <span
                    className="mt-[6px] size-1.5 shrink-0 rounded-full"
                    style={{ background: 'var(--accent)' }}
                  />
                  <div className="min-w-0">
                    <p className="t-label leading-snug" style={{ color: 'var(--text-body)' }}>
                      {a.summary}
                    </p>
                    <p className="t-micro" style={{ color: 'var(--text-muted)' }}>
                      {a.actorName} · {sejak(a.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
              {activity.length === 0 && (
                <li className="t-label" style={{ color: 'var(--text-muted)' }}>
                  Belum ada aktivitas.
                </li>
              )}
            </ul>
          </GlassCard>
        </div>
      </div>

      {/* ── riwayat proses gaji ── */}
      <GlassCard>
        <SectionTitle
          title="Riwayat proses gaji"
          action={
            <Link href="/payroll" className="btn btn-ghost btn-sm">
              Semua periode
              <ChevronRight size={13} />
            </Link>
          }
        />
        <div className="tbl-scroll scroll-slim">
          <table className="tbl" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                {['Periode', 'Status', 'Karyawan', 'Bruto', 'Potongan', 'Bersih', 'Tanggal bayar'].map((h, i) => (
                  <th
                    key={h}
                    className={`${
                      i > 1 && i < 6 ? 'text-right' : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...o.runs].reverse().map((r) => (
                <tr
                  key={r.id}
                >
                  <td>
                    <Link
                      href={`/payroll/${r.id}`}
                      className="font-medium"
                      style={{ color: 'var(--text-strong)' }}
                    >
                      {labelPeriode(r.period)}
                    </Link>
                  </td>
                  <td>
                    <StatusChip status={r.status} />
                  </td>
                  <td className="tnum text-right">{r.headcount}</td>
                  <td className="tnum text-right">{rupiah(r.totalGross)}</td>
                  <td className="tnum text-right" style={{ color: 'var(--color-clay-500)' }}>
                    −{rupiah(r.totalDeduction)}
                  </td>
                  <td
                    className="tnum text-right font-semibold"
                    style={{ color: 'var(--text-strong)' }}
                  >
                    {rupiah(r.totalNet)}
                  </td>
                  <td className="t-small">{tanggal(r.payDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

function PendingRow({
  href,
  icon,
  label,
  count,
  right,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  count: number | null;
  right?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="glass-thin flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)]"
      >
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        <span className="flex-1 t-small">{label}</span>
        {right ? (
          <span className="tnum t-small font-semibold" style={{ color: 'var(--text-strong)' }}>
            {right}
          </span>
        ) : count && count > 0 ? (
          <Chip tone="brass">{count} menunggu</Chip>
        ) : (
          <Chip tone="jade">bersih</Chip>
        )}
      </Link>
    </li>
  );
}
