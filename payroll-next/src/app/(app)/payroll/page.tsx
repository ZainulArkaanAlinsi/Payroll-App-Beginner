import Link from 'next/link';
import {
  ArrowRight, BadgeCheck, Calculator, CircleCheck, CircleDashed, Wallet,
} from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { labelPeriode, periodeSekarang, rupiah, rupiahRingkas, tanggal } from '@/lib/format';
import { Chip, EmptyState, GlassCard, SectionTitle, StatusChip } from '@/components/ui/Glass';
import StatTile from '@/components/ui/StatTile';
import { LineChart, StackedBars } from '@/components/ui/charts';
import RunDialog from './RunDialog';

export const metadata = { title: 'Proses Gaji' };

/** Empat tahap yang dilalui setiap periode, berikut arti tiap tahapnya. */
const TAHAP = [
  { status: 'DRAFT', desc: 'Periode dibuat, angkanya belum dihitung' },
  { status: 'CALCULATED', desc: 'Seluruh baris gaji dihitung ulang dari sumbernya' },
  { status: 'APPROVED', desc: 'Disetujui dan dikunci, siap dibayarkan' },
  { status: 'PAID', desc: 'Slip terbit, cicilan pinjaman berkurang' },
];

const NADA_BG = {
  brass: 'rgb(168 127 52 / .13)',
  info: 'var(--field-bg)',
  jade: 'var(--accent-soft)',
} as const;

const NADA_FG = {
  brass: 'var(--color-brass-500)',
  info: 'var(--text-muted)',
  jade: 'var(--accent)',
} as const;

export default async function PayrollPage() {
  await requireRole('ADMIN', 'HR');

  const [runs, setting, activeCount, tahapAlur] = await Promise.all([
    prisma.payrollRun.findMany({ orderBy: { period: 'desc' } }),
    prisma.companySetting.findUnique({ where: { id: 'singleton' } }),
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
    prisma.approvalStep.count({ where: { active: true } }),
  ]);

  const periodeKini = periodeSekarang();
  const runKini = runs.find((r) => r.period === periodeKini) ?? null;

  const selesai = runs.filter((r) => ['APPROVED', 'PAID'].includes(r.status));
  const urut = [...selesai].reverse().slice(-6);
  const tren = urut.map((r) => ({ label: labelPeriode(r.period).slice(0, 3), value: r.totalNet }));
  const tumpuk = urut.map((r) => ({
    label: labelPeriode(r.period).slice(0, 3),
    values: [r.totalNet, r.totalTax, r.totalDeduction - r.totalTax],
  }));

  const tahunIni = selesai.filter((r) => r.period.startsWith(String(new Date().getFullYear())));
  const biayaTahunIni = tahunIni.reduce((s, r) => s + r.totalEmployerCost, 0);
  const terakhir = selesai[0] ?? null;
  const menunggu = runs.filter((r) => r.status === 'DRAFT' || r.status === 'CALCULATED');

  // ── Satu kartu yang menjawab "apa yang harus saya lakukan sekarang" ──
  const langkah = (() => {
    if (!runKini) {
      return {
        nada: 'brass' as const,
        judul: `Periode ${labelPeriode(periodeKini)} belum dibuat`,
        pesan: 'Buat prosesnya agar kehadiran, lembur, dan cuti bulan ini ikut terhitung.',
        aksi: null,
      };
    }
    if (runKini.status === 'DRAFT') {
      return {
        nada: 'brass' as const,
        judul: `${labelPeriode(periodeKini)} menunggu dihitung`,
        pesan: `Tarik data ${activeCount} karyawan aktif ke dalam perhitungan.`,
        aksi: { href: `/payroll/${runKini.id}`, label: 'Hitung sekarang' },
      };
    }
    if (runKini.status === 'CALCULATED') {
      return {
        nada: 'info' as const,
        judul: `${labelPeriode(periodeKini)} menunggu persetujuan`,
        pesan:
          tahapAlur > 0
            ? `Alur ${tahapAlur} tahap harus dilalui berurutan sebelum dana bisa dirilis.`
            : 'Setujui periode ini agar bisa ditandai dibayarkan.',
        aksi: { href: `/payroll/${runKini.id}`, label: 'Tinjau periode' },
      };
    }
    if (runKini.status === 'APPROVED') {
      return {
        nada: 'jade' as const,
        judul: `${labelPeriode(periodeKini)} siap dibayarkan`,
        pesan: `Total ${rupiah(runKini.totalNet)} untuk ${runKini.headcount} karyawan.`,
        aksi: { href: `/payroll/${runKini.id}`, label: 'Tandai dibayar' },
      };
    }
    return {
      nada: 'jade' as const,
      judul: `${labelPeriode(periodeKini)} sudah dibayarkan`,
      pesan: `${runKini.headcount} karyawan menerima total ${rupiah(runKini.totalNet)}.`,
      aksi: { href: `/payroll/${runKini.id}`, label: 'Lihat rincian' },
    };
  })();

  return (
    <div className="page">
      <div className="page-head">
        <div className="min-w-0">
          <h1 className="t-display">Proses gaji</h1>
          <p className="mt-1 t-small">
            {runs.length} periode tercatat · {activeCount} karyawan aktif · gajian setiap tanggal{' '}
            {setting?.payDay ?? 25}
          </p>
        </div>
        <RunDialog
          suggestedPeriod={periodeKini}
          payDay={setting?.payDay ?? 25}
          takenPeriods={runs.map((r) => r.period)}
        />
      </div>

      {/* ── Langkah berikutnya ── */}
      <GlassCard
        className="flex flex-wrap items-center justify-between gap-5"
        style={{ borderColor: `color-mix(in srgb, ${NADA_FG[langkah.nada]} 30%, transparent)` }}
      >
        <div className="flex min-w-0 items-start gap-3.5">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-xl"
            style={{ background: NADA_BG[langkah.nada], color: NADA_FG[langkah.nada] }}
          >
            {langkah.nada === 'jade' ? <CircleCheck size={19} /> : <CircleDashed size={19} />}
          </span>
          <div className="min-w-0">
            <p className="label !mb-0.5">Langkah berikutnya</p>
            <p className="t-heading">{langkah.judul}</p>
            <p className="mt-0.5 t-small">{langkah.pesan}</p>
          </div>
        </div>

        {langkah.aksi ? (
          <Link href={langkah.aksi.href} className="btn btn-primary shrink-0">
            {langkah.aksi.label}
            <ArrowRight size={15} />
          </Link>
        ) : (
          <RunDialog
            suggestedPeriod={periodeKini}
            payDay={setting?.payDay ?? 25}
            takenPeriods={runs.map((r) => r.period)}
          />
        )}
      </GlassCard>

      {/* ── Angka kunci ── */}
      <div className="tiles">
        <StatTile
          label="Gaji terakhir dibayarkan"
          value={terakhir ? rupiahRingkas(terakhir.totalNet) : '—'}
          sub={
            terakhir ? `${labelPeriode(terakhir.period)} · ${terakhir.headcount} karyawan` : 'belum ada'
          }
          icon={<Wallet size={14} />}
        />
        <StatTile
          label={`Biaya tenaga kerja ${new Date().getFullYear()}`}
          value={rupiahRingkas(biayaTahunIni)}
          sub={`${tahunIni.length} periode selesai`}
        />
        <StatTile
          label="Menunggu diproses"
          value={String(menunggu.length)}
          sub={
            menunggu.length > 0
              ? menunggu.map((r) => labelPeriode(r.period)).join(', ')
              : 'semua periode selesai'
          }
        />
        <StatTile
          label="Alur persetujuan"
          value={tahapAlur > 0 ? `${tahapAlur} tahap` : 'Sekali klik'}
          sub={tahapAlur > 0 ? 'dilalui berurutan' : 'belum disusun di Racik'}
          icon={<BadgeCheck size={14} />}
        />
      </div>

      {selesai.length > 1 && (
        <div className="grid gap-3 xl:grid-cols-2">
          <GlassCard>
            <SectionTitle title="Gaji bersih dibayarkan" subtitle="Enam periode terakhir" />
            <LineChart data={tren} height={190} />
          </GlassCard>
          <GlassCard>
            <SectionTitle
              title="Ke mana bruto mengalir"
              subtitle="Uang yang diterima karyawan, disetor pajak, dan potongan lain"
            />
            <StackedBars
              data={tumpuk}
              keys={['Diterima karyawan', 'PPh 21', 'BPJS & potongan lain']}
              height={190}
            />
          </GlassCard>
        </div>
      )}

      {/* ── Daftar periode ── */}
      <GlassCard>
        <SectionTitle
          title="Semua periode"
          subtitle="Klik baris untuk membuka rincian dan menjalankan tahap berikutnya"
        />

        {runs.length === 0 ? (
          <EmptyState
            icon={<Wallet size={18} />}
            title="Belum ada proses gaji"
            hint="Buat periode pertama, lalu jalankan perhitungan untuk seluruh karyawan aktif."
          />
        ) : (
          <div className="tbl-scroll scroll-slim">
            <table className="tbl" style={{ minWidth: 880 }}>
              <thead>
                <tr>
                  <th style={{ width: '17%' }}>Periode</th>
                  <th>Status</th>
                  <th className="text-right">Karyawan</th>
                  <th className="text-right">Bruto</th>
                  <th className="text-right">PPh 21</th>
                  <th className="text-right">Potongan</th>
                  <th className="text-right">Diterima</th>
                  <th>Tanggal bayar</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link
                        href={`/payroll/${r.id}`}
                        style={{ color: 'var(--text-strong)', fontWeight: 600 }}
                      >
                        {labelPeriode(r.period)}
                      </Link>
                      {r.period === periodeKini && (
                        <span className="ml-1.5">
                          <Chip tone="jade">berjalan</Chip>
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusChip status={r.status} />
                    </td>
                    <td className="text-right">{r.headcount || '—'}</td>
                    <td className="text-right">{r.totalGross ? rupiah(r.totalGross) : '—'}</td>
                    <td className="text-right" style={{ color: 'var(--color-clay-500)' }}>
                      {r.totalTax ? `−${rupiah(r.totalTax)}` : '—'}
                    </td>
                    <td className="text-right" style={{ color: 'var(--color-clay-500)' }}>
                      {r.totalDeduction ? `−${rupiah(r.totalDeduction)}` : '—'}
                    </td>
                    <td className="text-right">{r.totalNet ? rupiah(r.totalNet) : '—'}</td>
                    <td>{tanggal(r.payDate)}</td>
                    <td className="text-right">
                      <Link href={`/payroll/${r.id}`} className="btn btn-ghost btn-sm">
                        {r.status === 'DRAFT' ? (
                          <>
                            <Calculator size={12} />
                            Hitung
                          </>
                        ) : (
                          'Buka'
                        )}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* ── Penjelasan tahapan ── */}
      <GlassCard>
        <SectionTitle
          title="Cara kerja tahapannya"
          subtitle="Tiap tahap mengunci tahap sebelumnya supaya angka tidak berubah diam-diam"
        />
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {TAHAP.map((t, i) => (
            <li key={t.status} className="glass-thin relative px-3.5 py-3">
              <span className="tnum absolute top-3 right-3 t-micro font-semibold">{i + 1}</span>
              <StatusChip status={t.status} />
              <p className="mt-2 t-label leading-snug" style={{ color: 'var(--text-body)' }}>
                {t.desc}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-3 t-micro">
          Menghitung ulang periode yang sudah disetujui membatalkan seluruh persetujuannya — angkanya
          berubah, jadi setiap tahap wajib meninjau ulang. Periode yang sudah dibayarkan terkunci
          sepenuhnya.
        </p>
      </GlassCard>
    </div>
  );
}
