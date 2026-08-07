import Link from 'next/link';
import { ChartColumn, Download } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { costByDepartment, costTerrain, deductionBreakdown } from '@/lib/analytics';
import { labelPeriode, rupiah, rupiahRingkas } from '@/lib/format';
import { Chip, EmptyState, GlassCard, SectionTitle } from '@/components/ui/Glass';
import StatTile from '@/components/ui/StatTile';
import { BarRank, Donut, LineChart, StackedBars } from '@/components/ui/charts';
import TerrainPanel from '@/components/three/TerrainPanel';

export const metadata = { title: 'Laporan' };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole('ADMIN', 'HR');
  const sp = await searchParams;

  const runs = await prisma.payrollRun.findMany({
    where: { status: { in: ['APPROVED', 'PAID'] } },
    orderBy: { period: 'desc' },
  });

  if (runs.length === 0) {
    return (
      <div className="mx-auto max-w-[1400px]">
        <GlassCard>
          <EmptyState
            icon={<ChartColumn size={18} />}
            title="Belum ada data untuk dilaporkan"
            hint="Laporan terbentuk setelah minimal satu proses gaji disetujui."
            action={
              <Link href="/payroll" className="btn btn-primary btn-sm">
                Ke proses gaji
              </Link>
            }
          />
        </GlassCard>
      </div>
    );
  }

  const selected = runs.find((r) => r.id === sp.run) ?? runs[0];

  const [byDept, deductions, terrain, ptkpSebaran, npwpKosong, terTinggi] = await Promise.all([
    costByDepartment(selected.id),
    deductionBreakdown(selected.id),
    costTerrain(6),
    prisma.employee.groupBy({
      by: ['ptkpStatus'],
      where: { status: 'ACTIVE' },
      _count: true,
      orderBy: { ptkpStatus: 'asc' },
    }),
    prisma.employee.count({ where: { status: 'ACTIVE', npwp: null } }),
    prisma.payrollItem.findMany({
      where: { runId: selected.id },
      orderBy: { pph21: 'desc' },
      take: 8,
      select: {
        id: true,
        pph21: true,
        terRate: true,
        taxableIncome: true,
        employee: { select: { id: true, fullName: true, ptkpStatus: true, npwp: true } },
      },
    }),
  ]);

  const kronologis = [...runs].reverse();
  const tren = kronologis.map((r) => ({
    label: labelPeriode(r.period).slice(0, 3),
    value: r.totalEmployerCost,
  }));
  const tumpuk = kronologis.slice(-6).map((r) => ({
    label: labelPeriode(r.period).slice(0, 3),
    values: [r.totalNet, r.totalTax, r.totalDeduction - r.totalTax],
  }));

  const totalTahun = runs
    .filter((r) => r.period.startsWith(String(new Date().getFullYear())))
    .reduce(
      (a, r) => ({
        cost: a.cost + r.totalEmployerCost,
        tax: a.tax + r.totalTax,
        net: a.net + r.totalNet,
      }),
      { cost: 0, tax: 0, net: 0 },
    );

  const rataRataBiaya = selected.headcount > 0 ? selected.totalEmployerCost / selected.headcount : 0;

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ letterSpacing: '-0.024em' }}>
            Laporan
          </h1>
          <p className="mt-1 text-[0.8125rem]">
            Analitik biaya tenaga kerja dan pajak · periode aktif {labelPeriode(selected.period)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <form className="flex gap-2">
            <select name="run" defaultValue={selected.id} className="field w-auto min-w-[11rem]">
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {labelPeriode(r.period)}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-ghost btn-sm">
              Terapkan
            </button>
          </form>
          <a href={`/api/export/payroll/${selected.id}`} className="btn btn-ghost btn-sm">
            <Download size={13} />
            CSV rinci
          </a>
          <a href={`/api/export/tax/${selected.id}`} className="btn btn-ghost btn-sm">
            <Download size={13} />
            Rekap PPh 21
          </a>
        </div>
      </div>

      {/* ── ringkasan tahun berjalan ── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={`Biaya tenaga kerja ${new Date().getFullYear()}`}
          value={rupiahRingkas(totalTahun.cost)}
          sub="akumulasi periode disetujui"
        />
        <StatTile
          label="PPh 21 disetor"
          value={rupiahRingkas(totalTahun.tax)}
          sub={`${((totalTahun.tax / (totalTahun.cost || 1)) * 100).toFixed(1)}% dari biaya`}
        />
        <StatTile
          label="Biaya rata-rata per karyawan"
          value={rupiahRingkas(rataRataBiaya)}
          sub={labelPeriode(selected.period)}
        />
        <StatTile
          label="Karyawan tanpa NPWP"
          value={String(npwpKosong)}
          sub={npwpKosong > 0 ? 'kena tarif PPh +20%' : 'semua sudah terdaftar'}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <GlassCard>
          <SectionTitle
            title="Tren biaya perusahaan"
            subtitle="Gaji bersih ditambah seluruh iuran yang ditanggung perusahaan"
          />
          <LineChart data={tren} height={200} />
        </GlassCard>

        <GlassCard>
          <SectionTitle
            title="Ke mana bruto mengalir"
            subtitle="Enam periode terakhir"
          />
          <StackedBars
            data={tumpuk}
            keys={['Diterima karyawan', 'PPh 21', 'BPJS & potongan lain']}
            height={200}
          />
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        <SectionTitle
          title="Bentang biaya departemen × periode"
          subtitle="Seret untuk memutar. Tinggi balok mewakili biaya perusahaan pada satu departemen di satu periode."
          action={<Chip tone="info">3D</Chip>}
        />
        <div className="-mx-2 h-[380px] sm:h-[440px]">
          <TerrainPanel
            cells={terrain.cells}
            departments={terrain.departments}
            periods={terrain.periods}
          />
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t pt-3" style={{ borderColor: 'var(--hairline)' }}>
          {terrain.departments.map((d, i) => (
            <li key={d} className="flex items-center gap-1.5 text-[0.6875rem]" style={{ color: 'var(--text-body)' }}>
              <span className="size-2 rounded-[3px]" style={{ background: `var(--series-${(i % 6) + 1})` }} aria-hidden />
              {d}
            </li>
          ))}
        </ul>
      </GlassCard>

      <div className="grid gap-3 xl:grid-cols-3">
        <GlassCard className="xl:col-span-2">
          <SectionTitle
            title="Biaya per departemen"
            subtitle={labelPeriode(selected.period)}
          />
          <BarRank
            colored
            data={byDept.map((d, i) => ({
              label: d.name,
              value: d.cost,
              colorIndex: i,
              sub: `${d.count} karyawan · diterima ${rupiahRingkas(d.net)} · rata-rata ${rupiahRingkas(
                d.cost / (d.count || 1),
              )}`,
            }))}
          />
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Komposisi potongan" subtitle={labelPeriode(selected.period)} />
          <Donut
            data={deductions}
            centerLabel="Total"
            centerValue={rupiahRingkas(selected.totalDeduction)}
            format="ringkas"
          />
        </GlassCard>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <GlassCard>
          <SectionTitle
            title="Sebaran status PTKP"
            subtitle="Menentukan kategori tarif efektif yang dipakai tiap karyawan"
          />
          <BarRank
            data={ptkpSebaran.map((p) => ({
              label: p.ptkpStatus,
              value: p._count,
              sub:
                p.ptkpStatus === 'K/3'
                  ? 'kategori TER C'
                  : ['TK/2', 'TK/3', 'K/1', 'K/2'].includes(p.ptkpStatus)
                    ? 'kategori TER B'
                    : 'kategori TER A',
            }))}
            format="orang"
            tooltipFormat="orang"
          />
        </GlassCard>

        <GlassCard>
          <SectionTitle
            title="PPh 21 terbesar"
            subtitle={`Delapan pemotongan tertinggi pada ${labelPeriode(selected.period)}`}
          />
          <div className="scroll-slim -mx-1 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr style={{ color: 'var(--text-muted)' }}>
                  {['Karyawan', 'PTKP', 'Tarif', 'PPh 21'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-2 pb-2 text-[0.6875rem] font-semibold tracking-wide uppercase ${
                        i >= 2 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {terTinggi.map((t) => (
                  <tr key={t.id} style={{ borderTop: '1px solid var(--hairline)' }}>
                    <td className="px-2 py-2">
                      <Link
                        href={`/employees/${t.employee.id}`}
                        className="text-[0.8125rem] font-medium"
                        style={{ color: 'var(--text-strong)' }}
                      >
                        {t.employee.fullName}
                      </Link>
                      {!t.employee.npwp && (
                        <span className="ml-1.5">
                          <Chip tone="brass">tanpa NPWP</Chip>
                        </span>
                      )}
                    </td>
                    <td className="tnum px-2 py-2 text-[0.75rem]">{t.employee.ptkpStatus}</td>
                    <td className="tnum px-2 py-2 text-right text-[0.75rem]">{t.terRate}%</td>
                    <td
                      className="tnum px-2 py-2 text-right text-[0.8125rem] font-semibold"
                      style={{ color: 'var(--text-strong)' }}
                    >
                      {rupiah(t.pph21)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
