import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, BadgeCheck, Calculator, Download, RotateCcw, Trash2, Wallet,
} from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { costByDepartment, deductionBreakdown } from '@/lib/analytics';
import { labelPeriode, rupiah, rupiahRingkas, tanggal, tanggalPanjang } from '@/lib/format';
import {
  Avatar, Chip, EmptyState, GlassCard, SectionTitle, StatusChip,
} from '@/components/ui/Glass';
import { ActionButton } from '@/components/ui/Feedback';
import { BarRank, Donut } from '@/components/ui/charts';
import StatTile from '@/components/ui/StatTile';
import { approveRun, calculateRun, deleteRun, payRun, reopenRun } from '@/actions/payroll';
import ApprovalChain, { type StepView } from './ApprovalChain';

export const metadata = { title: 'Detail Proses Gaji' };

export default async function RunDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole('ADMIN', 'HR');
  const { id } = await params;

  const run = await prisma.payrollRun.findUnique({ where: { id } });
  if (!run) notFound();

  const [items, byDept, deductions, steps, approvals, bankFormats] = await Promise.all([
    prisma.payrollItem.findMany({
      where: { runId: id },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeNo: true,
            npwp: true,
            ptkpStatus: true,
            bankName: true,
            bankAccount: true,
            position: { select: { title: true } },
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { netPay: 'desc' },
    }),
    run.status !== 'DRAFT' ? costByDepartment(id) : Promise.resolve([]),
    run.status !== 'DRAFT' ? deductionBreakdown(id) : Promise.resolve([]),
    prisma.approvalStep.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.runApproval.findMany({ where: { runId: id } }),
    prisma.bankFormat.findMany({ orderBy: [{ isDefault: 'desc' }, { name: 'asc' }] }),
  ]);

  // Gabungkan tahap dengan keputusan yang sudah ada supaya komponen klien
  // menerima satu bentuk data yang siap ditampilkan.
  const rantai: StepView[] = steps.map((s) => {
    const a = approvals.find((x) => x.stepId === s.id);
    return {
      id: s.id,
      name: s.name,
      role: s.role,
      note: s.note,
      decision: (a?.decision as 'APPROVED' | 'REJECTED' | undefined) ?? null,
      decidedBy: a?.decidedBy ?? null,
      decidedAt: a?.decidedAt.toISOString() ?? null,
      decisionNote: a?.note ?? null,
    };
  });
  const pakaiAlur = rantai.length > 0;

  const isAdmin = session.role === 'ADMIN';
  const totalEmployerBpjs = items.reduce(
    (s, i) => s + i.bpjsKesEmployer + i.bpjsJhtEmployer + i.bpjsJpEmployer + i.bpjsJkkEmployer + i.bpjsJkmEmployer,
    0,
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <Link
        href="/payroll"
        className="inline-flex items-center gap-1.5 t-label"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={13} />
        Kembali ke daftar periode
      </Link>

      {/* ── kepala & aksi alur ── */}
      <GlassCard className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="t-display">
              {labelPeriode(run.period)}
            </h1>
            <StatusChip status={run.status} />
          </div>
          <p className="mt-1.5 t-small">
            Tanggal bayar {tanggalPanjang(run.payDate)}
            {run.calculatedAt && ` · dihitung ${tanggal(run.calculatedAt)}`}
            {run.approvedBy && ` · disetujui ${run.approvedBy}`}
          </p>
          {run.note && (
            <p className="mt-1 t-label" style={{ color: 'var(--text-muted)' }}>
              Catatan: {run.note}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {run.status !== 'PAID' && (
            <ActionButton
              action={calculateRun.bind(null, run.id)}
              className="btn btn-primary btn-sm"
              pendingLabel="Menghitung…"
              confirm={
                run.status === 'DRAFT'
                  ? undefined
                  : 'Hitung ulang akan menimpa seluruh baris gaji periode ini. Lanjutkan?'
              }
            >
              <Calculator size={13} />
              {run.status === 'DRAFT' ? 'Hitung gaji' : 'Hitung ulang'}
            </ActionButton>
          )}

          {run.status === 'CALCULATED' && isAdmin && !pakaiAlur && (
            <ActionButton
              action={approveRun.bind(null, run.id)}
              className="btn btn-primary btn-sm"
              confirm="Setujui periode ini? Angkanya akan dikunci."
            >
              <BadgeCheck size={13} />
              Setujui
            </ActionButton>
          )}

          {run.status === 'APPROVED' && isAdmin && (
            <>
              <ActionButton
                action={payRun.bind(null, run.id)}
                className="btn btn-primary btn-sm"
                confirm="Tandai sudah dibayarkan? Slip gaji akan terbit dan cicilan pinjaman berkurang."
              >
                <Wallet size={13} />
                Tandai dibayar
              </ActionButton>
              <ActionButton
                action={reopenRun.bind(null, run.id)}
                className="btn btn-ghost btn-sm"
                confirm="Cabut persetujuan agar periode bisa dihitung ulang?"
              >
                <RotateCcw size={13} />
                Cabut persetujuan
              </ActionButton>
            </>
          )}

          {items.length > 0 && (
            <>
              <a href={`/api/export/payroll/${run.id}`} className="btn btn-ghost btn-sm">
                <Download size={13} />
                CSV rinci
              </a>
              {bankFormats.map((f) => (
                <a
                  key={f.id}
                  href={`/api/export/bank/${run.id}?format=${f.id}`}
                  className="btn btn-ghost btn-sm"
                  title={`Susunan kolom mengikuti format ${f.name}`}
                >
                  <Download size={13} />
                  {f.name}
                </a>
              ))}
            </>
          )}

          {run.status !== 'PAID' && isAdmin && (
            <ActionButton
              action={deleteRun.bind(null, run.id)}
              className="btn btn-danger btn-sm"
              confirm={`Hapus proses gaji ${labelPeriode(run.period)} beserta seluruh baris perhitungannya?`}
            >
              <Trash2 size={13} />
              Hapus
            </ActionButton>
          )}
        </div>
      </GlassCard>

      {run.status === 'DRAFT' && items.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={<Calculator size={18} />}
            title="Periode ini belum dihitung"
            hint="Tekan “Hitung gaji” untuk menarik data karyawan, kehadiran, lembur yang disetujui, dan pinjaman berjalan ke dalam perhitungan."
          />
        </GlassCard>
      ) : (
        <>
          {pakaiAlur && run.status !== 'PAID' && (
            <GlassCard>
              <SectionTitle
                title="Alur persetujuan"
                subtitle={
                  run.status === 'APPROVED'
                    ? 'Seluruh tahap selesai — periode siap dibayarkan'
                    : 'Tahap dilalui berurutan; tahap berikutnya terkunci sampai tahap sebelumnya selesai'
                }
              />
              <ApprovalChain
                runId={run.id}
                steps={rantai}
                role={session.role}
                runStatus={run.status}
              />
            </GlassCard>
          )}

          {/* ── ringkasan angka ── */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Bruto" value={rupiahRingkas(run.totalGross)} sub={`${run.headcount} karyawan`} />
            <StatTile
              label="Total potongan"
              value={rupiahRingkas(run.totalDeduction)}
              sub={`termasuk PPh 21 ${rupiahRingkas(run.totalTax)}`}
            />
            <StatTile
              label="Dibayarkan"
              value={rupiahRingkas(run.totalNet)}
              sub="take home pay seluruh karyawan"
            />
            <StatTile
              label="Biaya perusahaan"
              value={rupiahRingkas(run.totalEmployerCost)}
              sub={`BPJS pemberi kerja ${rupiahRingkas(totalEmployerBpjs)}`}
            />
          </div>

          {byDept.length > 0 && (
            <div className="grid gap-3 xl:grid-cols-2">
              <GlassCard>
                <SectionTitle title="Biaya per departemen" />
                <BarRank
                  colored
                  data={byDept.map((d, i) => ({
                    label: d.name,
                    value: d.cost,
                    colorIndex: i,
                    sub: `${d.count} karyawan · diterima ${rupiahRingkas(d.net)}`,
                  }))}
                />
              </GlassCard>
              <GlassCard>
                <SectionTitle title="Komposisi potongan" />
                <Donut
                  data={deductions}
                  centerLabel="Total potongan"
                  centerValue={rupiahRingkas(run.totalDeduction)}
                  format="ringkas"
                />
              </GlassCard>
            </div>
          )}

          {/* ── rincian per karyawan ── */}
          <GlassCard>
            <SectionTitle
              title="Rincian per karyawan"
              subtitle={`${items.length} baris · klik untuk membuka slip gaji`}
            />
            <div className="scroll-slim -mx-1 overflow-x-auto">
              <table className="w-full min-w-[1000px] t-body">
                <thead>
                  <tr style={{ color: 'var(--text-muted)' }}>
                    {[
                      'Karyawan', 'Gaji pokok', 'Tunjangan', 'Lembur', 'Bruto',
                      'BPJS', 'PPh 21', 'Potongan lain', 'Diterima', '',
                    ].map((h, i) => (
                      <th
                        key={h || i}
                        className={`px-2 pb-2 t-micro font-semibold tracking-wide uppercase ${
                          i > 0 && i < 9 ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const bpjs = it.bpjsKesEmployee + it.bpjsJhtEmployee + it.bpjsJpEmployee;
                    const lain = it.otherDeduction + it.loanDeduction + it.unpaidLeaveCut + it.lateCut;
                    return (
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
                                {it.employee.department?.name ?? '—'} · {it.employee.ptkpStatus}
                                {!it.employee.npwp && ' · tanpa NPWP'}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="tnum px-2 py-2.5 text-right t-small">{rupiah(it.baseSalary)}</td>
                        <td className="tnum px-2 py-2.5 text-right t-small">
                          {rupiah(it.allowanceTaxable + it.allowanceNonTax)}
                        </td>
                        <td className="tnum px-2 py-2.5 text-right t-small">
                          {it.overtimePay > 0 ? rupiah(it.overtimePay) : '—'}
                        </td>
                        <td
                          className="tnum px-2 py-2.5 text-right t-small font-medium"
                          style={{ color: 'var(--text-strong)' }}
                        >
                          {rupiah(it.grossPay)}
                        </td>
                        <td className="tnum px-2 py-2.5 text-right t-small" style={{ color: 'var(--color-clay-500)' }}>
                          −{rupiah(bpjs)}
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <span className="tnum block t-small" style={{ color: 'var(--color-clay-500)' }}>
                            −{rupiah(it.pph21)}
                          </span>
                          <span className="tnum block t-micro" style={{ color: 'var(--text-muted)' }}>
                            {it.taxMethod === 'TER' ? `TER ${it.terRate}%` : 'progresif'}
                          </span>
                        </td>
                        <td className="tnum px-2 py-2.5 text-right t-small" style={{ color: 'var(--color-clay-500)' }}>
                          {lain > 0 ? `−${rupiah(lain)}` : '—'}
                        </td>
                        <td
                          className="tnum px-2 py-2.5 text-right t-small font-semibold"
                          style={{ color: 'var(--text-strong)' }}
                        >
                          {rupiah(it.netPay)}
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <Link href={`/payslip/${it.id}`} className="btn btn-ghost btn-sm">
                            Slip
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--hairline)' }}>
                    <td className="px-2 pt-3 t-small font-semibold" style={{ color: 'var(--text-strong)' }}>
                      Total {items.length} karyawan
                    </td>
                    <td colSpan={3} />
                    <td className="tnum px-2 pt-3 text-right t-small font-semibold" style={{ color: 'var(--text-strong)' }}>
                      {rupiah(run.totalGross)}
                    </td>
                    <td colSpan={3} />
                    <td className="tnum px-2 pt-3 text-right t-body font-bold" style={{ color: 'var(--accent)' }}>
                      {rupiah(run.totalNet)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </GlassCard>

          {run.status === 'PAID' && (
            <GlassCard className="flex flex-wrap items-center gap-3">
              <Chip tone="jade" dot>
                Periode terkunci
              </Chip>
              <p className="t-small">
                Gaji sudah dibayarkan pada {tanggalPanjang(run.paidAt)}. Angka pada periode ini tidak
                bisa diubah lagi demi menjaga keutuhan arsip.
              </p>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}
