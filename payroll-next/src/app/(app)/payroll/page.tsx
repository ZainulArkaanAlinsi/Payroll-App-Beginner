import Link from 'next/link';
import { ArrowRight, Calculator, CircleCheck, Wallet } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { labelPeriode, periodeSekarang, rupiah, rupiahRingkas, tanggal } from '@/lib/format';
import { Chip, EmptyState, GlassCard, SectionTitle, StatusChip } from '@/components/ui/Glass';
import { LineChart, StackedBars } from '@/components/ui/charts';
import RunDialog from './RunDialog';

export const metadata = { title: 'Proses Gaji' };

const LANGKAH = [
  { status: 'DRAFT', label: 'Draf', desc: 'Periode dibuat, belum ada perhitungan' },
  { status: 'CALCULATED', label: 'Terhitung', desc: 'Semua baris gaji sudah dihitung' },
  { status: 'APPROVED', label: 'Disetujui', desc: 'Dikunci, siap dibayarkan' },
  { status: 'PAID', label: 'Dibayarkan', desc: 'Slip terbit, cicilan berkurang' },
];

export default async function PayrollPage() {
  await requireRole('ADMIN', 'HR');

  const [runs, setting, activeCount] = await Promise.all([
    prisma.payrollRun.findMany({ orderBy: { period: 'desc' } }),
    prisma.companySetting.findUnique({ where: { id: 'singleton' } }),
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
  ]);

  const selesai = runs.filter((r) => ['APPROVED', 'PAID'].includes(r.status));
  const urut = [...selesai].reverse().slice(-6);

  const tren = urut.map((r) => ({ label: labelPeriode(r.period).slice(0, 3), value: r.totalNet }));
  const tumpuk = urut.map((r) => ({
    label: labelPeriode(r.period).slice(0, 3),
    values: [r.totalNet, r.totalTax, r.totalDeduction - r.totalTax],
  }));

  const totalTahunIni = selesai
    .filter((r) => r.period.startsWith(String(new Date().getFullYear())))
    .reduce((s, r) => s + r.totalEmployerCost, 0);

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ letterSpacing: '-0.024em' }}>
            Proses gaji
          </h1>
          <p className="mt-1 text-[0.8125rem]">
            {runs.length} periode tercatat · {activeCount} karyawan aktif siap diproses
          </p>
        </div>
        <RunDialog
          suggestedPeriod={periodeSekarang()}
          payDay={setting?.payDay ?? 25}
          takenPeriods={runs.map((r) => r.period)}
        />
      </div>

      {/* ── alur kerja ── */}
      <GlassCard>
        <SectionTitle
          title="Alur proses gaji"
          subtitle="Tiap tahap mengunci tahap sebelumnya supaya angka tidak berubah diam-diam"
        />
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {LANGKAH.map((l, i) => (
            <li key={l.status} className="glass-thin relative px-3.5 py-3">
              <span
                className="tnum absolute top-3 right-3 text-[0.625rem] font-semibold"
                style={{ color: 'var(--text-muted)' }}
              >
                {i + 1}
              </span>
              <StatusChip status={l.status} />
              <p className="mt-2 text-[0.75rem] leading-snug">{l.desc}</p>
            </li>
          ))}
        </ol>
      </GlassCard>

      {selesai.length > 1 && (
        <div className="grid gap-3 xl:grid-cols-2">
          <GlassCard>
            <SectionTitle title="Gaji bersih dibayarkan" subtitle="Enam periode terakhir" />
            <LineChart data={tren} height={190} />
          </GlassCard>
          <GlassCard>
            <SectionTitle
              title="Ke mana bruto mengalir"
              subtitle="Perbandingan uang yang diterima karyawan, disetor pajak, dan potongan lain"
            />
            <StackedBars
              data={tumpuk}
              keys={['Diterima karyawan', 'PPh 21', 'BPJS & potongan lain']}
              height={190}
            />
          </GlassCard>
        </div>
      )}

      <GlassCard>
        <SectionTitle
          title="Semua periode"
          action={
            totalTahunIni > 0 ? (
              <Chip tone="info">
                Biaya {new Date().getFullYear()}: {rupiahRingkas(totalTahunIni)}
              </Chip>
            ) : undefined
          }
        />

        {runs.length === 0 ? (
          <EmptyState
            icon={<Wallet size={18} />}
            title="Belum ada proses gaji"
            hint="Buat periode pertama, lalu jalankan perhitungan untuk seluruh karyawan aktif."
          />
        ) : (
          <ul className="space-y-2">
            {runs.map((r) => (
              <li key={r.id}>
                <Link href={`/payroll/${r.id}`} className="block">
                  <div className="glass-thin flex flex-wrap items-center gap-4 px-4 py-3 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)]">
                    <div className="min-w-[9rem]">
                      <p className="text-[0.9375rem] font-semibold" style={{ color: 'var(--text-strong)' }}>
                        {labelPeriode(r.period)}
                      </p>
                      <p className="text-[0.6875rem]" style={{ color: 'var(--text-muted)' }}>
                        bayar {tanggal(r.payDate)}
                      </p>
                    </div>

                    <StatusChip status={r.status} />

                    <div className="ml-auto flex flex-wrap items-center gap-x-6 gap-y-2">
                      <Angka label="Karyawan" value={String(r.headcount)} />
                      <Angka label="Bruto" value={rupiah(r.totalGross)} />
                      <Angka label="PPh 21" value={rupiah(r.totalTax)} />
                      <Angka
                        label="Diterima"
                        value={rupiah(r.totalNet)}
                        strong
                      />
                      <span style={{ color: 'var(--text-muted)' }}>
                        {r.status === 'DRAFT' ? (
                          <Calculator size={16} />
                        ) : r.status === 'PAID' ? (
                          <CircleCheck size={16} style={{ color: 'var(--color-jade-500)' }} />
                        ) : (
                          <ArrowRight size={16} />
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}

function Angka({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <span className="text-right">
      <span className="block text-[0.625rem] tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span
        className="tnum block text-[0.8125rem]"
        style={{
          color: 'var(--text-strong)',
          fontWeight: strong ? 650 : 500,
        }}
      >
        {value}
      </span>
    </span>
  );
}
