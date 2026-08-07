import Link from 'next/link';
import { CircleUser, Receipt, TriangleAlert } from 'lucide-react';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  jamMenit, labelPeriode, periodeSekarang, rupiah, rupiahRingkas, tanggal,
} from '@/lib/format';
import { PTKP_LABEL, type PtkpStatus } from '@/lib/tax';
import {
  Avatar, Chip, EmptyState, GlassCard, MiniBar, SectionTitle, StatusChip, statusLabel,
} from '@/components/ui/Glass';
import StatTile from '@/components/ui/StatTile';
import { LineChart, Sparkline } from '@/components/ui/charts';
import ClockCard from './ClockCard';
import { LeaveDialog } from '../leave/LeaveControls';
import { OvertimeDialog } from '../overtime/OvertimeControls';

export const metadata = { title: 'Portal Saya' };

export default async function MePage() {
  const session = await requireSession();

  if (!session.employeeId) {
    return (
      <div className="mx-auto max-w-2xl">
        <GlassCard>
          <EmptyState
            icon={<TriangleAlert size={18} />}
            title="Akun ini belum tertaut ke data karyawan"
            hint="Akun administrator murni tidak punya data kepegawaian. Gunakan akun karyawan untuk melihat portal mandiri."
            action={
              <Link href="/dashboard" className="btn btn-primary btn-sm">
                Ke dasbor
              </Link>
            }
          />
        </GlassCard>
      </div>
    );
  }

  const id = session.employeeId;
  const period = periodeSekarang();
  const [y, m] = period.split('-').map(Number);
  const today = new Date();
  const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const [employee, setting, hariIni, bulanIni, slips, cuti, lembur, pinjaman] = await Promise.all([
    prisma.employee.findUnique({
      where: { id },
      include: {
        department: { select: { name: true } },
        position: { select: { title: true } },
        components: { include: { component: true } },
      },
    }),
    prisma.companySetting.findUnique({ where: { id: 'singleton' } }),
    prisma.attendance.findUnique({ where: { employeeId_date: { employeeId: id, date: todayKey } } }),
    prisma.attendance.findMany({
      where: { employeeId: id, date: { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) } },
      orderBy: { date: 'desc' },
    }),
    prisma.payrollItem.findMany({
      where: { employeeId: id, run: { status: { in: ['APPROVED', 'PAID'] } } },
      include: { run: { select: { period: true, status: true, payDate: true } } },
      orderBy: { run: { period: 'desc' } },
      take: 12,
    }),
    prisma.leaveRequest.findMany({ where: { employeeId: id }, orderBy: { startDate: 'desc' }, take: 8 }),
    prisma.overtime.findMany({ where: { employeeId: id }, orderBy: { date: 'desc' }, take: 8 }),
    prisma.loan.findFirst({
      where: { employeeId: id, status: 'ACTIVE' },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
  ]);

  if (!employee) {
    return (
      <div className="mx-auto max-w-2xl">
        <GlassCard>
          <EmptyState icon={<CircleUser size={18} />} title="Data karyawan tidak ditemukan" />
        </GlassCard>
      </div>
    );
  }

  const hadir = bulanIni.filter((a) => ['PRESENT', 'LATE', 'WFH'].includes(a.status)).length;
  const telat = bulanIni.filter((a) => a.status === 'LATE').length;
  const mangkir = bulanIni.filter((a) => a.status === 'ABSENT').length;
  const menitTelat = bulanIni.reduce((s, a) => s + a.lateMinutes, 0);

  const cutiTerpakai = cuti
    .filter((l) => l.type === 'ANNUAL' && l.status === 'APPROVED' && l.startDate.getFullYear() === y)
    .reduce((s, l) => s + l.days, 0);
  const sisaCuti = employee.annualLeaveQuota - cutiTerpakai;

  const slipTerakhir = slips[0];
  const tren = [...slips].reverse().slice(-6).map((s) => ({
    label: labelPeriode(s.run.period).slice(0, 3),
    value: s.netPay,
  }));

  const lemburDisetujui = lembur.filter((o) => o.status === 'APPROVED');
  const jamLembur = lemburDisetujui.reduce((s, o) => s + o.hours, 0);
  const nilaiLembur = lemburDisetujui.reduce((s, o) => s + o.amount, 0);

  return (
    <div className="mx-auto max-w-[1200px] space-y-4">
      {/* ── kepala ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={employee.fullName} hue={session.avatarHue} size={52} />
          <div>
            <h1 className="text-xl font-semibold" style={{ letterSpacing: '-0.02em' }}>
              {employee.fullName}
            </h1>
            <p className="text-[0.8125rem]">
              {employee.position?.title ?? '—'}
              {employee.department && ` · ${employee.department.name}`}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Chip tone="neutral">{employee.employeeNo}</Chip>
              <StatusChip status={employee.status} />
              <Chip tone="info">{statusLabel(employee.employmentType)}</Chip>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <LeaveDialog fixedEmployeeId={id} />
          <OvertimeDialog fixedEmployeeId={id} baseSalary={employee.baseSalary} />
        </div>
      </div>

      {/* ── absen ── */}
      <ClockCard
        clockIn={hariIni?.clockIn?.toISOString() ?? null}
        clockOut={hariIni?.clockOut?.toISOString() ?? null}
        status={hariIni?.status ?? null}
        lateMinutes={hariIni?.lateMinutes ?? 0}
        workStart={setting?.workStart ?? '09:00'}
      />

      {/* ── angka pribadi ── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Gaji terakhir diterima"
          value={slipTerakhir ? rupiahRingkas(slipTerakhir.netPay) : '—'}
          sub={slipTerakhir ? labelPeriode(slipTerakhir.run.period) : 'belum ada slip'}
          chart={tren.length > 1 ? <Sparkline values={tren.map((t) => t.value)} /> : undefined}
        />
        <StatTile
          label="Sisa cuti tahunan"
          value={`${sisaCuti} hari`}
          sub={`terpakai ${cutiTerpakai} dari ${employee.annualLeaveQuota}`}
        />
        <StatTile
          label={`Kehadiran ${labelPeriode(period)}`}
          value={String(hadir)}
          sub={`${telat} terlambat · ${mangkir} mangkir`}
        />
        <StatTile
          label="Lembur disetujui"
          value={`${jamLembur} jam`}
          sub={nilaiLembur > 0 ? rupiahRingkas(nilaiLembur) : 'belum ada'}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div className="space-y-4">
          {tren.length > 1 && (
            <GlassCard>
              <SectionTitle title="Tren gaji diterima" subtitle="Enam periode terakhir" />
              <LineChart data={tren} height={180} />
            </GlassCard>
          )}

          {/* ── slip gaji ── */}
          <GlassCard>
            <SectionTitle title="Slip gaji saya" subtitle="Klik untuk membuka slip yang bisa dicetak" />
            {slips.length === 0 ? (
              <EmptyState
                icon={<Receipt size={18} />}
                title="Belum ada slip gaji"
                hint="Slip terbit setelah proses gaji periode berjalan disetujui."
              />
            ) : (
              <div className="scroll-slim -mx-1 overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr style={{ color: 'var(--text-muted)' }}>
                      {['Periode', 'Bruto', 'PPh 21', 'Potongan', 'Diterima', ''].map((h, i) => (
                        <th
                          key={h || i}
                          className={`px-2 pb-2 text-[0.6875rem] font-semibold tracking-wide uppercase ${
                            i >= 1 && i <= 4 ? 'text-right' : 'text-left'
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {slips.map((s) => (
                      <tr
                        key={s.id}
                        className="transition-colors hover:bg-[var(--field-bg)]"
                        style={{ borderTop: '1px solid var(--hairline)' }}
                      >
                        <td className="px-2 py-2.5">
                          <span className="text-[0.8125rem] font-medium" style={{ color: 'var(--text-strong)' }}>
                            {labelPeriode(s.run.period)}
                          </span>
                          <span className="block text-[0.625rem]" style={{ color: 'var(--text-muted)' }}>
                            dibayar {tanggal(s.run.payDate)}
                          </span>
                        </td>
                        <td className="tnum px-2 py-2.5 text-right text-[0.8125rem]">{rupiah(s.grossPay)}</td>
                        <td
                          className="tnum px-2 py-2.5 text-right text-[0.8125rem]"
                          style={{ color: 'var(--color-clay-500)' }}
                        >
                          −{rupiah(s.pph21)}
                        </td>
                        <td
                          className="tnum px-2 py-2.5 text-right text-[0.8125rem]"
                          style={{ color: 'var(--color-clay-500)' }}
                        >
                          −{rupiah(s.totalDeduction)}
                        </td>
                        <td
                          className="tnum px-2 py-2.5 text-right text-[0.8125rem] font-semibold"
                          style={{ color: 'var(--text-strong)' }}
                        >
                          {rupiah(s.netPay)}
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <Link href={`/payslip/${s.id}`} className="btn btn-ghost btn-sm">
                            Buka
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>

          {/* ── kehadiran bulan ini ── */}
          <GlassCard>
            <SectionTitle title={`Kehadiran ${labelPeriode(period)}`} subtitle="Sepuluh catatan terakhir" />
            {bulanIni.length === 0 ? (
              <EmptyState title="Belum ada catatan bulan ini" />
            ) : (
              <ul className="space-y-1.5">
                {bulanIni.slice(0, 10).map((a) => (
                  <li key={a.id} className="glass-thin flex flex-wrap items-center gap-3 px-3.5 py-2">
                    <span className="min-w-[7rem] text-[0.8125rem]" style={{ color: 'var(--text-strong)' }}>
                      {tanggal(a.date)}
                    </span>
                    <StatusChip status={a.status} />
                    <span className="tnum text-[0.75rem]" style={{ color: 'var(--text-muted)' }}>
                      {a.clockIn
                        ? `${new Date(a.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} – ${
                            a.clockOut
                              ? new Date(a.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                              : 'belum pulang'
                          }`
                        : '—'}
                    </span>
                    {a.workMinutes > 0 && (
                      <span className="ml-auto text-[0.75rem]" style={{ color: 'var(--text-muted)' }}>
                        {jamMenit(a.workMinutes)}
                      </span>
                    )}
                    {a.lateMinutes > 0 && <Chip tone="brass">telat {a.lateMinutes}m</Chip>}
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>

        {/* ── sisi kanan ── */}
        <div className="space-y-4">
          <GlassCard>
            <SectionTitle title="Kuota cuti" />
            <div className="flex items-baseline justify-between">
              <span className="tnum text-2xl font-semibold" style={{ color: 'var(--text-strong)' }}>
                {sisaCuti}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                dari {employee.annualLeaveQuota} hari
              </span>
            </div>
            <div className="mt-2">
              <MiniBar value={cutiTerpakai} max={employee.annualLeaveQuota} tone="brass" />
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle title="Pengajuan cuti saya" />
            {cuti.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Belum ada pengajuan.
              </p>
            ) : (
              <ul className="space-y-2">
                {cuti.map((l) => (
                  <li key={l.id} className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block text-[0.75rem]" style={{ color: 'var(--text-body)' }}>
                        {statusLabel(l.type)} · {l.days} hari
                      </span>
                      <span className="block text-[0.625rem]" style={{ color: 'var(--text-muted)' }}>
                        {tanggal(l.startDate)} – {tanggal(l.endDate)}
                      </span>
                      {l.reviewNote && (
                        <span className="block text-[0.625rem]" style={{ color: 'var(--color-clay-500)' }}>
                          {l.reviewNote}
                        </span>
                      )}
                    </span>
                    <StatusChip status={l.status} />
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          <GlassCard>
            <SectionTitle title="Pengajuan lembur saya" />
            {lembur.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Belum ada pengajuan.
              </p>
            ) : (
              <ul className="space-y-2">
                {lembur.map((o) => (
                  <li key={o.id} className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block text-[0.75rem]" style={{ color: 'var(--text-body)' }}>
                        {o.hours} jam · {tanggal(o.date)}
                      </span>
                      <span className="block text-[0.625rem]" style={{ color: 'var(--text-muted)' }}>
                        {o.amount > 0 ? rupiah(o.amount) : o.reason.slice(0, 34)}
                      </span>
                    </span>
                    <StatusChip status={o.status} />
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          {pinjaman && (
            <GlassCard>
              <SectionTitle title="Pinjaman berjalan" />
              <p className="tnum text-lg font-semibold" style={{ color: 'var(--text-strong)' }}>
                {rupiah(pinjaman.remaining)}
              </p>
              <p className="text-[0.6875rem]" style={{ color: 'var(--text-muted)' }}>
                sisa dari {rupiah(pinjaman.principal)}
              </p>
              <div className="mt-2">
                <MiniBar value={pinjaman.principal - pinjaman.remaining} max={pinjaman.principal} />
              </div>
              <p className="mt-1.5 text-[0.6875rem]" style={{ color: 'var(--text-muted)' }}>
                Dipotong {rupiah(pinjaman.monthlyDeduction)} tiap bulan.
              </p>
            </GlassCard>
          )}

          <GlassCard>
            <SectionTitle title="Data pajak & bank" />
            <dl className="space-y-2.5 text-[0.75rem]">
              <Baris k="Status PTKP" v={PTKP_LABEL[employee.ptkpStatus as PtkpStatus] ?? employee.ptkpStatus} />
              <Baris k="NPWP" v={employee.npwp ?? 'Belum terdaftar'} />
              <Baris
                k="Rekening"
                v={employee.bankAccount ? `${employee.bankName ?? ''} ${employee.bankAccount}` : '—'}
              />
              <Baris k="BPJS Kesehatan" v={employee.bpjsKesehatanNo ?? '—'} />
              <Baris k="BPJS Ketenagakerjaan" v={employee.bpjsTkNo ?? '—'} />
            </dl>
            {!employee.npwp && (
              <p
                className="mt-3 rounded-lg px-3 py-2 text-[0.6875rem]"
                style={{ background: 'rgb(168 127 52 / .14)', color: 'var(--color-brass-500)' }}
              >
                Tanpa NPWP, PPh 21 Anda dikenakan 20% lebih tinggi. Sampaikan NPWP ke bagian SDM
                untuk memperbaikinya.
              </p>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function Baris({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[0.625rem] tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
        {k}
      </dt>
      <dd style={{ color: 'var(--text-body)' }}>{v}</dd>
    </div>
  );
}
