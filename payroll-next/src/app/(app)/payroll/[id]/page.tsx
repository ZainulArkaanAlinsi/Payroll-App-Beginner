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
import Stepper from '@/components/ui/Stepper';
import TransferPanel from './TransferPanel';
import { periksaTransfer, ringkasTransfer } from '@/lib/transfer';

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
            bankHolder: true,
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

  // Gaji bersih periode sebelumnya dipakai mendeteksi lonjakan yang
  // biasanya berarti salah input, bukan kenaikan sungguhan.
  const runSebelum = await prisma.payrollRun.findFirst({
    where: { period: { lt: run.period }, status: { in: ['APPROVED', 'PAID'] } },
    orderBy: { period: 'desc' },
    select: { id: true },
  });
  const lalu = runSebelum
    ? await prisma.payrollItem.findMany({
        where: { runId: runSebelum.id },
        select: { employeeId: true, netPay: true },
      })
    : [];
  const petaLalu = new Map(lalu.map((l) => [l.employeeId, l.netPay]));

  const barisTransfer = items.map((it) => ({
    employeeId: it.employee.id,
    nama: it.employee.fullName,
    bankName: it.employee.bankName,
    bankAccount: it.employee.bankAccount,
    bankHolder: it.employee.bankHolder,
    netPay: it.netPay,
    netPayLalu: petaLalu.get(it.employee.id) ?? null,
  }));

  const temuanTransfer = periksaTransfer(barisTransfer);
  const ringkasanTransfer = ringkasTransfer(barisTransfer);

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
    <div className="page">
      <Link
        href="/payroll"
        className="inline-flex items-center gap-1.5 t-label"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={13} />
        Kembali ke daftar periode
      </Link>

      {/* ── kepala: identitas periode & posisi tahapnya ── */}
      <GlassCard className="!p-0">
        <div className="flex flex-wrap items-start justify-between gap-5 px-6 pt-6 pb-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="t-display" style={{ fontSize: '1.5rem' }}>
                {run.kind === 'THR' ? `THR ${run.holidayName ?? ''}`.trim() : labelPeriode(run.period)}
              </h1>
              <StatusChip status={run.status} />
              {run.kind === 'THR' && <Chip tone="brass">Permenaker 6/2016</Chip>}
            </div>
            <p className="mt-1 t-small">
              Tanggal bayar {tanggalPanjang(run.payDate)}
              {run.calculatedAt && ` · dihitung ${tanggal(run.calculatedAt)}`}
              {run.approvedBy && ` · disetujui ${run.approvedBy}`}
            </p>
            {run.note && <p className="mt-0.5 t-micro">Catatan: {run.note}</p>}
          </div>

          {/* Hanya satu tombol utama pada satu waktu — sisanya sekunder,
              supaya tidak ada keraguan tentang langkah berikutnya. */}
          <div className="page-head-actions">
            {run.status !== 'PAID' && (
              <ActionButton
                action={calculateRun.bind(null, run.id)}
                className={run.status === 'DRAFT' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                pendingLabel="Menghitung…"
                confirmTitle={run.status === 'DRAFT' ? undefined : 'Hitung ulang seluruh periode?'}
                confirmLabel="Hitung ulang"
                confirm={
                  run.status === 'DRAFT'
                    ? undefined
                    : 'Seluruh baris gaji ditulis ulang dari data terbaru, dan persetujuan yang sudah diberikan dibatalkan.'
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
                confirmTitle="Setujui periode ini?"
                confirmLabel="Setujui"
                confirm="Angka periode ini akan dikunci dan siap dibayarkan."
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
                  confirmTitle="Tandai sudah dibayarkan?"
                  confirmLabel="Tandai dibayar"
                  confirm={`Slip gaji ${items.length} karyawan akan terbit dan cicilan pinjaman berkurang. Setelah ini periode terkunci sepenuhnya.`}
                >
                  <Wallet size={13} />
                  Tandai dibayar
                </ActionButton>
                <ActionButton
                  action={reopenRun.bind(null, run.id)}
                  className="btn btn-ghost btn-sm"
                  confirmTitle="Cabut persetujuan?"
                  confirm="Periode kembali ke status terhitung sehingga bisa diperbaiki dan dihitung ulang."
                >
                  <RotateCcw size={13} />
                  Cabut persetujuan
                </ActionButton>
              </>
            )}

            {run.status !== 'PAID' && isAdmin && (
              <ActionButton
                action={deleteRun.bind(null, run.id)}
                className="btn btn-danger btn-sm"
                confirmTitle={`Hapus proses gaji ${labelPeriode(run.period)}?`}
                confirmLabel="Hapus periode"
                confirm="Seluruh baris perhitungan periode ini ikut terhapus dan tidak bisa dikembalikan."
              >
                <Trash2 size={13} />
                Hapus
              </ActionButton>
            )}
          </div>
        </div>

        <div className="border-t px-6 py-4" style={{ borderColor: 'var(--hairline)' }}>
          <Stepper
            aktifIndex={['DRAFT', 'CALCULATED', 'APPROVED', 'PAID'].indexOf(run.status)}
            langkah={[
              { key: 'draft', label: 'Draf', catatan: 'periode dibuat' },
              {
                key: 'calc',
                label: 'Terhitung',
                catatan: run.calculatedAt ? tanggal(run.calculatedAt) : `${items.length || 0} baris`,
              },
              {
                key: 'appr',
                label: 'Disetujui',
                catatan: pakaiAlur ? `${rantai.filter((r) => r.decision === 'APPROVED').length}/${rantai.length} tahap` : run.approvedBy ?? 'menunggu',
              },
              {
                key: 'paid',
                label: 'Dibayarkan',
                catatan: run.paidAt ? tanggal(run.paidAt) : 'belum',
              },
            ]}
          />
        </div>

        {items.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-2 border-t px-6 py-3"
            style={{ borderColor: 'var(--hairline)', background: 'var(--field-bg)' }}
          >
            <span className="label !mb-0 mr-1">Unduh</span>
            <a href={`/api/export/payroll/${run.id}`} className="btn btn-ghost btn-sm">
              <Download size={13} />
              Rincian payroll
            </a>
            <a href={`/api/export/tax/${run.id}`} className="btn btn-ghost btn-sm">
              <Download size={13} />
              Rekap PPh 21
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
          </div>
        )}
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

          {(run.status === 'APPROVED' || run.status === 'PAID') && (
            <TransferPanel
              runId={run.id}
              runStatus={run.status}
              temuan={temuanTransfer}
              ringkasan={ringkasanTransfer}
              formats={bankFormats.map((f) => ({ id: f.id, name: f.name }))}
              baris={items.map((it) => ({
                itemId: it.id,
                employeeId: it.employee.id,
                nama: it.employee.fullName,
                bank: it.employee.bankName ?? '',
                rekening: it.employee.bankAccount ?? '',
                netPay: it.netPay,
                status: it.transferStatus,
                catatan: it.transferNote,
              }))}
            />
          )}

          {/* ── ringkasan angka ── */}
          <div className="tiles">
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
            <div className="tbl-scroll scroll-slim">
              <table className="tbl" style={{ minWidth: 1000 }}>
                <thead>
                  <tr>
                    {[
                      'Karyawan', 'Gaji pokok', 'Tunjangan', 'Lembur', 'Bruto',
                      'BPJS', 'PPh 21', 'Potongan lain', 'Diterima', '',
                    ].map((h, i) => (
                      <th
                        key={h || i}
                        className={`${
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
                      >
                        <td>
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
                        <td className="tnum text-right t-small">{rupiah(it.baseSalary)}</td>
                        <td className="tnum text-right t-small">
                          {rupiah(it.allowanceTaxable + it.allowanceNonTax)}
                        </td>
                        <td className="tnum text-right t-small">
                          {it.overtimePay > 0 ? rupiah(it.overtimePay) : '—'}
                        </td>
                        <td
                          className="tnum text-right t-small font-medium"
                          style={{ color: 'var(--text-strong)' }}
                        >
                          {rupiah(it.grossPay)}
                        </td>
                        <td className="tnum text-right t-small" style={{ color: 'var(--color-clay-500)' }}>
                          −{rupiah(bpjs)}
                        </td>
                        <td className="text-right">
                          <span className="tnum block t-small" style={{ color: 'var(--color-clay-500)' }}>
                            −{rupiah(it.pph21)}
                          </span>
                          <span className="tnum block t-micro" style={{ color: 'var(--text-muted)' }}>
                            {it.taxMethod === 'TER' ? `TER ${it.terRate}%` : 'progresif'}
                          </span>
                        </td>
                        <td className="tnum text-right t-small" style={{ color: 'var(--color-clay-500)' }}>
                          {lain > 0 ? `−${rupiah(lain)}` : '—'}
                        </td>
                        <td
                          className="tnum text-right t-small font-semibold"
                          style={{ color: 'var(--text-strong)' }}
                        >
                          {rupiah(it.netPay)}
                        </td>
                        <td className="text-right">
                          <Link href={`/payslip/${it.id}`} className="btn btn-ghost btn-sm">
                            Slip
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="t-small font-semibold" style={{ color: 'var(--text-strong)' }}>
                      Total {items.length} karyawan
                    </td>
                    <td colSpan={3} />
                    <td className="tnum text-right t-small font-semibold" style={{ color: 'var(--text-strong)' }}>
                      {rupiah(run.totalGross)}
                    </td>
                    <td colSpan={3} />
                    <td className="tnum text-right t-body font-bold" style={{ color: 'var(--accent)' }}>
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
