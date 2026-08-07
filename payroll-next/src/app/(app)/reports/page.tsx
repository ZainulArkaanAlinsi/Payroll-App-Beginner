import Link from 'next/link';
import {
  ArrowDownRight, ArrowUpRight, ChartColumn, CircleAlert, Info, Minus, TrendingUp,
} from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { costTerrain, departmentComparison, susunSorotan } from '@/lib/analytics';
import { labelPeriode, rupiah, rupiahRingkas } from '@/lib/format';
import { Chip, EmptyState, GlassCard, MiniBar, SectionTitle } from '@/components/ui/Glass';
import StatTile from '@/components/ui/StatTile';
import { Donut, LineChart, StackedBars } from '@/components/ui/charts';
import { seriesColor } from '@/lib/series';
import TerrainPanel from '@/components/three/TerrainPanel';
import RunPicker from './RunPicker';

export const metadata = { title: 'Laporan' };

const NADA_IKON = {
  jade: ArrowDownRight,
  brass: ArrowUpRight,
  clay: CircleAlert,
  info: Info,
} as const;

const NADA_WARNA = {
  jade: 'var(--color-jade-500)',
  brass: 'var(--color-brass-500)',
  clay: 'var(--color-clay-500)',
  info: 'var(--text-muted)',
} as const;

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
      <div className="page">
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
  const indeks = runs.findIndex((r) => r.id === selected.id);
  // runs terurut menurun, jadi periode sebelumnya ada di indeks berikutnya
  const sebelumnya = runs[indeks + 1] ?? null;

  const [byDept, terrain, ptkpSebaran, npwpKosong, terTinggi] = await Promise.all([
    departmentComparison(selected.id, sebelumnya?.id),
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
      take: 6,
      select: {
        id: true,
        pph21: true,
        terRate: true,
        employee: { select: { id: true, fullName: true, ptkpStatus: true, npwp: true } },
      },
    }),
  ]);

  const sorotan = susunSorotan({
    periode: selected.period,
    totalEmployerCost: selected.totalEmployerCost,
    totalNet: selected.totalNet,
    totalTax: selected.totalTax,
    headcount: selected.headcount,
    prevCost: sebelumnya?.totalEmployerCost ?? null,
    departemen: byDept,
    tanpaNpwp: npwpKosong,
  });

  const kronologis = [...runs].reverse();
  const tren = kronologis.map((r) => ({
    label: labelPeriode(r.period).slice(0, 3),
    value: r.totalEmployerCost,
  }));
  const tumpuk = kronologis.slice(-6).map((r) => ({
    label: labelPeriode(r.period).slice(0, 3),
    values: [r.totalNet, r.totalTax, r.totalDeduction - r.totalTax],
  }));

  const tahunIni = runs.filter((r) => r.period.startsWith(String(new Date().getFullYear())));
  const ytd = tahunIni.reduce(
    (a, r) => ({ cost: a.cost + r.totalEmployerCost, tax: a.tax + r.totalTax }),
    { cost: 0, tax: 0 },
  );

  const perKaryawan = selected.headcount > 0 ? selected.totalEmployerCost / selected.headcount : 0;
  const perKaryawanLalu =
    sebelumnya && sebelumnya.headcount > 0 ? sebelumnya.totalEmployerCost / sebelumnya.headcount : null;

  const pct = (kini: number, lalu: number | null) =>
    lalu && lalu > 0 ? ((kini - lalu) / lalu) * 100 : null;

  // Ke mana setiap rupiah biaya perusahaan mengalir
  const bpjsPerusahaan = selected.totalEmployerCost - selected.totalGross;
  const aliran = [
    { label: 'Diterima karyawan', value: selected.totalNet },
    { label: 'PPh 21', value: selected.totalTax },
    { label: 'BPJS & potongan', value: selected.totalDeduction - selected.totalTax },
    { label: 'BPJS perusahaan', value: Math.max(0, bpjsPerusahaan) },
  ].filter((x) => x.value > 0);

  const maxDept = Math.max(...byDept.map((d) => d.cost), 1);

  return (
    <div className="page">
      <div className="page-head">
        <div className="min-w-0">
          <h1 className="t-display">Laporan</h1>
          <p className="mt-1 t-small">
            Biaya tenaga kerja dan kepatuhan pajak · {labelPeriode(selected.period)}
            {sebelumnya && ` dibanding ${labelPeriode(sebelumnya.period)}`}
          </p>
        </div>
        <RunPicker
          runs={runs.map((r) => ({ id: r.id, label: labelPeriode(r.period) }))}
          selectedId={selected.id}
        />
      </div>

      {/* ── ringkasan otomatis ── */}
      <GlassCard>
        <SectionTitle
          title="Yang perlu diperhatikan"
          subtitle="Disusun langsung dari angka periode ini, bukan ditulis tangan"
        />
        <ul className="grid gap-2 sm:grid-cols-2">
          {sorotan.map((s, i) => {
            const Ikon = NADA_IKON[s.nada];
            return (
              <li key={i} className="glass-thin flex items-start gap-2.5 px-3.5 py-2.5">
                <Ikon size={15} className="mt-px shrink-0" style={{ color: NADA_WARNA[s.nada] }} />
                <span className="t-small">{s.teks}</span>
              </li>
            );
          })}
        </ul>
      </GlassCard>

      {/* ── angka kunci ── */}
      <div className="tiles">
        <StatTile
          label="Biaya tenaga kerja"
          value={rupiahRingkas(selected.totalEmployerCost)}
          delta={pct(selected.totalEmployerCost, sebelumnya?.totalEmployerCost ?? null)}
          invertDelta
          sub={`${selected.headcount} karyawan pada ${labelPeriode(selected.period)}`}
          icon={<TrendingUp size={14} />}
        />
        <StatTile
          label="Biaya per karyawan"
          value={rupiahRingkas(perKaryawan)}
          delta={pct(perKaryawan, perKaryawanLalu)}
          invertDelta
          sub="rata-rata seluruh departemen"
        />
        <StatTile
          label="PPh 21 disetor"
          value={rupiahRingkas(selected.totalTax)}
          delta={pct(selected.totalTax, sebelumnya?.totalTax ?? null)}
          invertDelta
          sub={`${((selected.totalTax / (selected.totalEmployerCost || 1)) * 100).toFixed(1)}% dari biaya tenaga kerja`}
        />
        <StatTile
          label={`Akumulasi ${new Date().getFullYear()}`}
          value={rupiahRingkas(ytd.cost)}
          sub={`${tahunIni.length} periode · pajak ${rupiahRingkas(ytd.tax)}`}
        />
      </div>

      {/* ── tren & aliran ── */}
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <GlassCard>
          <SectionTitle
            title="Tren biaya tenaga kerja"
            subtitle="Gaji bersih ditambah seluruh iuran yang ditanggung perusahaan"
          />
          <LineChart data={tren} height={210} />
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Ke mana biayanya mengalir" subtitle={labelPeriode(selected.period)} />
          <Donut
            data={aliran}
            centerLabel="Biaya perusahaan"
            centerValue={rupiahRingkas(selected.totalEmployerCost)}
            format="ringkas"
          />
        </GlassCard>
      </div>

      {/* ── tabel perbandingan departemen ── */}
      <GlassCard>
        <SectionTitle
          title="Biaya per departemen"
          subtitle={
            sebelumnya
              ? `Kolom selisih dihitung terhadap ${labelPeriode(sebelumnya.period)}`
              : 'Belum ada periode pembanding'
          }
        />
        <div className="tbl-scroll scroll-slim">
          <table className="tbl" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th style={{ width: '24%' }}>Departemen</th>
                <th className="text-right">Karyawan</th>
                <th className="text-right">Biaya</th>
                <th className="text-right">Per karyawan</th>
                <th className="text-right">Selisih</th>
                <th style={{ width: '20%' }}>Pangsa</th>
              </tr>
            </thead>
            <tbody>
              {byDept.map((d, i) => (
                <tr key={d.id}>
                  <td>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-[3px]"
                        style={{ background: seriesColor(i) }}
                        aria-hidden
                      />
                      <span style={{ color: 'var(--text-strong)', fontWeight: 550 }}>{d.name}</span>
                    </span>
                  </td>
                  <td className="text-right">{d.count}</td>
                  <td className="text-right">{rupiah(d.cost)}</td>
                  <td className="text-right">{rupiah(d.perKaryawan)}</td>
                  <td className="text-right">
                    {d.delta === null ? (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-0.5"
                        style={{
                          color:
                            Math.abs(d.delta) < 0.5
                              ? 'var(--text-muted)'
                              : d.delta > 0
                                ? 'var(--color-brass-500)'
                                : 'var(--color-jade-500)',
                        }}
                      >
                        {Math.abs(d.delta) < 0.5 ? (
                          <Minus size={11} />
                        ) : d.delta > 0 ? (
                          <ArrowUpRight size={11} />
                        ) : (
                          <ArrowDownRight size={11} />
                        )}
                        {d.delta > 0 ? '+' : ''}
                        {d.delta.toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="flex items-center gap-2">
                      <span className="flex-1">
                        <MiniBar value={d.cost} max={maxDept} />
                      </span>
                      <span className="tnum t-micro w-9 text-right">{d.pangsa.toFixed(0)}%</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td className="text-right">{selected.headcount}</td>
                <td className="text-right">{rupiah(selected.totalEmployerCost)}</td>
                <td className="text-right">{rupiah(perKaryawan)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </GlassCard>

      {/* ── bentang 3D ── */}
      <GlassCard className="overflow-hidden">
        <SectionTitle
          title="Bentang biaya departemen × periode"
          subtitle="Seret untuk memutar. Tinggi balok mewakili biaya perusahaan pada satu departemen di satu periode."
          action={<Chip tone="info">3D</Chip>}
        />
        <div className="-mx-2 h-[360px] sm:h-[420px]">
          <TerrainPanel
            cells={terrain.cells}
            departments={terrain.departments}
            periods={terrain.periods}
          />
        </div>
        <ul
          className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t pt-3"
          style={{ borderColor: 'var(--hairline)' }}
        >
          {terrain.departments.map((d, i) => (
            <li key={d} className="flex items-center gap-1.5 t-micro" style={{ color: 'var(--text-body)' }}>
              <span
                className="size-2 rounded-[3px]"
                style={{ background: `var(--series-${(i % 6) + 1})` }}
                aria-hidden
              />
              {d}
            </li>
          ))}
        </ul>
      </GlassCard>

      {/* ── komposisi & kepatuhan pajak ── */}
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <GlassCard>
          <SectionTitle
            title="Komposisi bruto enam periode"
            subtitle="Perbandingan uang yang diterima karyawan, disetor pajak, dan potongan lain"
          />
          <StackedBars
            data={tumpuk}
            keys={['Diterima karyawan', 'PPh 21', 'BPJS & potongan lain']}
            height={200}
          />
        </GlassCard>

        <GlassCard>
          <SectionTitle
            title="Kepatuhan pajak"
            subtitle={`Sebaran PTKP dan pemotongan terbesar pada ${labelPeriode(selected.period)}`}
            action={
              npwpKosong > 0 ? (
                <Chip tone="clay">{npwpKosong} tanpa NPWP</Chip>
              ) : (
                <Chip tone="jade">NPWP lengkap</Chip>
              )
            }
          />

          <p className="label">Sebaran status PTKP</p>
          <ul className="mb-4 flex flex-wrap gap-1.5">
            {ptkpSebaran.map((p) => {
              const kategori =
                p.ptkpStatus === 'K/3'
                  ? 'C'
                  : ['TK/2', 'TK/3', 'K/1', 'K/2'].includes(p.ptkpStatus)
                    ? 'B'
                    : 'A';
              return (
                <li
                  key={p.ptkpStatus}
                  className="glass-thin px-2.5 py-1.5"
                  title={`Kategori tarif TER ${kategori}`}
                >
                  <span className="tnum t-label" style={{ color: 'var(--text-strong)' }}>
                    {p.ptkpStatus}
                  </span>
                  <span className="tnum t-micro ml-1.5">{p._count} org</span>
                  <span className="t-micro ml-1" style={{ color: 'var(--accent)' }}>
                    TER {kategori}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="label">PPh 21 terbesar</p>
          <div className="tbl-scroll scroll-slim">
            <table className="tbl" style={{ minWidth: 380 }}>
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th className="text-right">PTKP</th>
                  <th className="text-right">Tarif</th>
                  <th className="text-right">PPh 21</th>
                </tr>
              </thead>
              <tbody>
                {terTinggi.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link
                        href={`/employees/${t.employee.id}`}
                        style={{ color: 'var(--text-strong)', fontWeight: 550 }}
                      >
                        {t.employee.fullName}
                      </Link>
                      {!t.employee.npwp && (
                        <span className="ml-1.5">
                          <Chip tone="brass">tanpa NPWP</Chip>
                        </span>
                      )}
                    </td>
                    <td className="text-right">{t.employee.ptkpStatus}</td>
                    <td className="text-right">{t.terRate}%</td>
                    <td className="text-right">{rupiah(t.pph21)}</td>
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
