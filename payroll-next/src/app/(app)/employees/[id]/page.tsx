import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, Banknote, Building2, CalendarDays, CreditCard, Mail,
  MapPin, Phone, Receipt, ShieldCheck, Trash2,
} from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculatePayroll, workingDaysInPeriod, type ComponentLine } from '@/lib/payroll-engine';
import { PTKP_LABEL, type PtkpStatus } from '@/lib/tax';
import { jamMenit, labelPeriode, periodeSekarang, rupiah, tanggal, tanggalPanjang } from '@/lib/format';
import {
  Avatar, Chip, EmptyState, GlassCard, MiniBar, SectionTitle, StatusChip, statusLabel,
} from '@/components/ui/Glass';
import { ActionButton } from '@/components/ui/Feedback';
import EmployeeDialog from '../EmployeeDialog';
import ComponentToggles from './ComponentToggles';
import { deleteEmployee } from '@/actions/employees';

export const metadata = { title: 'Detail Karyawan' };

export default async function EmployeeDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole('ADMIN', 'HR');
  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      department: true,
      position: true,
      components: { include: { component: true } },
    },
  });
  if (!employee) notFound();

  const period = periodeSekarang();
  const [y, m] = period.split('-').map(Number);

  const [departments, positions, allComponents, payslips, attendance, leaves, loans, setting] =
    await Promise.all([
      prisma.department.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
      prisma.position.findMany({
        orderBy: { title: 'asc' },
        select: { id: true, title: true, departmentId: true, minSalary: true, maxSalary: true },
      }),
      prisma.salaryComponent.findMany({ where: { active: true }, orderBy: [{ type: 'asc' }, { name: 'asc' }] }),
      prisma.payrollItem.findMany({
        where: { employeeId: id },
        include: { run: { select: { id: true, period: true, status: true, payDate: true } } },
        orderBy: { run: { period: 'desc' } },
        take: 8,
      }),
      prisma.attendance.findMany({
        where: { employeeId: id, date: { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) } },
        orderBy: { date: 'desc' },
      }),
      prisma.leaveRequest.findMany({ where: { employeeId: id }, orderBy: { startDate: 'desc' }, take: 6 }),
      prisma.loan.findMany({ where: { employeeId: id }, orderBy: { createdAt: 'desc' } }),
      prisma.companySetting.findUnique({ where: { id: 'singleton' } }),
    ]);

  // ── simulasi gaji bulan berjalan, dihitung dengan mesin yang sama ──
  const lines: ComponentLine[] = employee.components
    .filter((c) => c.component.active)
    .map((c) => ({
      code: c.component.code,
      name: c.component.name,
      type: c.component.type as 'ALLOWANCE' | 'DEDUCTION',
      amount:
        c.overrideAmount ??
        (c.component.calcType === 'PERCENT_OF_BASE'
          ? Math.round((employee.baseSalary * c.component.percent) / 100)
          : c.component.amount),
      taxable: c.component.taxable,
    }));

  const hadir = attendance.filter((a) => ['PRESENT', 'LATE', 'WFH'].includes(a.status)).length;
  const mangkir = attendance.filter((a) => a.status === 'ABSENT').length;
  const cuti = attendance.filter((a) => a.status === 'LEAVE').length;
  const totalTelat = attendance.reduce((s, a) => s + a.lateMinutes, 0);
  // pinjaman terlama — sama dengan yang dipakai mesin penggajian
  const pinjamanAktif = loans.filter((l) => l.status === 'ACTIVE').sort((a, b) => +a.createdAt - +b.createdAt)[0];

  const simulasi = calculatePayroll({
    employeeId: employee.id,
    fullName: employee.fullName,
    baseSalary: employee.baseSalary,
    ptkpStatus: employee.ptkpStatus as PtkpStatus,
    hasNpwp: Boolean(employee.npwp),
    enrollBpjsKes: employee.enrollBpjsKes,
    enrollBpjsTk: employee.enrollBpjsTk,
    components: lines,
    overtimeHours: 0,
    overtimeHolidayHours: 0,
    presentDays: hadir,
    absentDays: mangkir,
    leaveDays: cuti,
    unpaidLeaveDays: 0,
    lateMinutes: totalTelat,
    loanDeduction: pinjamanAktif?.monthlyDeduction ?? 0,
    workingDays: workingDaysInPeriod(period),
    lateCutPerMinute: setting?.lateCutPerMinute ?? 0,
    cutAbsent: setting?.absentCutPerDay ?? true,
    bpjs: {
      kesEmployeeRate: setting?.bpjsKesEmployeeRate ?? 1,
      kesEmployerRate: setting?.bpjsKesEmployerRate ?? 4,
      kesCap: setting?.bpjsKesCap ?? 12_000_000,
      jhtEmployeeRate: setting?.bpjsJhtEmployeeRate ?? 2,
      jhtEmployerRate: setting?.bpjsJhtEmployerRate ?? 3.7,
      jpEmployeeRate: setting?.bpjsJpEmployeeRate ?? 1,
      jpEmployerRate: setting?.bpjsJpEmployerRate ?? 2,
      jpCap: setting?.bpjsJpCap ?? 10_547_400,
      jkkRate: setting?.bpjsJkkRate ?? 0.24,
      jkmRate: setting?.bpjsJkmRate ?? 0.3,
    },
  });

  const penerimaan = simulasi.breakdown.filter((r) => r.group === 'EARNING');
  const potongan = simulasi.breakdown.filter((r) => r.group === 'DEDUCTION');

  const formData = {
    id: employee.id,
    fullName: employee.fullName,
    email: employee.email,
    phone: employee.phone,
    nik: employee.nik,
    npwp: employee.npwp,
    gender: employee.gender,
    address: employee.address,
    departmentId: employee.departmentId,
    positionId: employee.positionId,
    joinDate: employee.joinDate.toISOString().slice(0, 10),
    employmentType: employee.employmentType,
    status: employee.status,
    baseSalary: employee.baseSalary,
    ptkpStatus: employee.ptkpStatus,
    bankName: employee.bankName,
    bankAccount: employee.bankAccount,
    annualLeaveQuota: employee.annualLeaveQuota,
    enrollBpjsKes: employee.enrollBpjsKes,
    enrollBpjsTk: employee.enrollBpjsTk,
  };

  const cutiTerpakai = leaves
    .filter((l) => l.type === 'ANNUAL' && l.status === 'APPROVED' && l.startDate.getFullYear() === y)
    .reduce((s, l) => s + l.days, 0);

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <Link
        href="/employees"
        className="inline-flex items-center gap-1.5 text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={13} />
        Kembali ke daftar karyawan
      </Link>

      {/* ── kepala ── */}
      <GlassCard className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={employee.fullName} size={60} />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold" style={{ letterSpacing: '-0.02em' }}>
              {employee.fullName}
            </h1>
            <p className="mt-0.5 text-[0.8125rem]">
              {employee.position?.title ?? 'Tanpa posisi'}
              {employee.department && ` · ${employee.department.name}`}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StatusChip status={employee.status} />
              <Chip tone="info">{statusLabel(employee.employmentType)}</Chip>
              <Chip tone="neutral">{employee.employeeNo}</Chip>
              {!employee.npwp && <Chip tone="brass">tanpa NPWP · PPh +20%</Chip>}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <EmployeeDialog
            employee={formData}
            departments={departments}
            positions={positions}
            trigger="icon"
          />
          {session.role === 'ADMIN' && (
            <ActionButton
              action={deleteEmployee.bind(null, employee.id)}
              className="btn btn-danger btn-sm"
              confirm={`Hapus ${employee.fullName}? Bila sudah punya riwayat gaji, statusnya akan diubah menjadi mengundurkan diri, bukan dihapus.`}
            >
              <Trash2 size={13} />
              Hapus
            </ActionButton>
          )}
        </div>
      </GlassCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="space-y-4">
          {/* ── simulasi gaji ── */}
          <GlassCard>
            <SectionTitle
              title={`Simulasi gaji ${labelPeriode(period)}`}
              subtitle="Dihitung dengan mesin yang sama dengan proses gaji sesungguhnya, memakai kehadiran bulan berjalan"
              action={<Chip tone="jade">langsung</Chip>}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="label">Penerimaan</p>
                <ul className="space-y-1.5">
                  {penerimaan.map((r, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
                      <span className="min-w-0">
                        <span className="truncate">{r.label}</span>
                        {r.note && (
                          <span className="block text-[0.625rem]" style={{ color: 'var(--text-muted)' }}>
                            {r.note}
                          </span>
                        )}
                      </span>
                      <span className="tnum shrink-0 font-medium" style={{ color: 'var(--text-strong)' }}>
                        {rupiah(r.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div
                  className="mt-2.5 flex items-baseline justify-between border-t pt-2.5 text-[0.8125rem] font-semibold"
                  style={{ borderColor: 'var(--hairline)', color: 'var(--text-strong)' }}
                >
                  <span>Bruto</span>
                  <span className="tnum">{rupiah(simulasi.grossPay)}</span>
                </div>
              </div>

              <div>
                <p className="label">Potongan</p>
                <ul className="space-y-1.5">
                  {potongan.map((r, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
                      <span className="min-w-0">
                        <span className="truncate">{r.label}</span>
                        {r.note && (
                          <span className="block text-[0.625rem]" style={{ color: 'var(--text-muted)' }}>
                            {r.note}
                          </span>
                        )}
                      </span>
                      <span className="tnum shrink-0" style={{ color: 'var(--color-clay-500)' }}>
                        −{rupiah(r.amount)}
                      </span>
                    </li>
                  ))}
                  {potongan.length === 0 && (
                    <li className="text-[0.8125rem]" style={{ color: 'var(--text-muted)' }}>
                      Tidak ada potongan.
                    </li>
                  )}
                </ul>
                <div
                  className="mt-2.5 flex items-baseline justify-between border-t pt-2.5 text-[0.8125rem] font-semibold"
                  style={{ borderColor: 'var(--hairline)', color: 'var(--color-clay-500)' }}
                >
                  <span>Total potongan</span>
                  <span className="tnum">−{rupiah(simulasi.totalDeduction)}</span>
                </div>
              </div>
            </div>

            <div
              className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl px-4 py-3"
              style={{ background: 'var(--accent-soft)' }}
            >
              <div>
                <p className="label !mb-0.5">Perkiraan diterima</p>
                <p className="tnum text-xl font-semibold" style={{ color: 'var(--text-strong)' }}>
                  {rupiah(simulasi.netPay)}
                </p>
              </div>
              <div className="text-right">
                <p className="label !mb-0.5">Biaya perusahaan</p>
                <p className="tnum text-sm font-semibold" style={{ color: 'var(--text-strong)' }}>
                  {rupiah(simulasi.employerCost)}
                </p>
                <p className="text-[0.625rem]" style={{ color: 'var(--text-muted)' }}>
                  PPh 21 {simulasi.taxMethod === 'TER' ? `TER ${simulasi.terRate}%` : 'progresif'}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* ── komponen gaji ── */}
          <GlassCard>
            <SectionTitle
              title="Komponen gaji melekat"
              subtitle="Centang untuk menempelkan komponen ke karyawan ini"
            />
            <ComponentToggles
              employeeId={employee.id}
              baseSalary={employee.baseSalary}
              components={allComponents.map((c) => ({
                id: c.id,
                code: c.code,
                name: c.name,
                type: c.type,
                calcType: c.calcType,
                amount: c.amount,
                percent: c.percent,
                taxable: c.taxable,
                attached: employee.components.some((ec) => ec.componentId === c.id),
              }))}
            />
          </GlassCard>

          {/* ── riwayat slip ── */}
          <GlassCard>
            <SectionTitle title="Riwayat slip gaji" subtitle="Delapan periode terakhir" />
            {payslips.length === 0 ? (
              <EmptyState icon={<Receipt size={18} />} title="Belum ada slip gaji" />
            ) : (
              <div className="scroll-slim -mx-1 overflow-x-auto">
                <table className="w-full min-w-[620px] text-sm">
                  <thead>
                    <tr style={{ color: 'var(--text-muted)' }}>
                      {['Periode', 'Status', 'Bruto', 'PPh 21', 'Potongan', 'Diterima', ''].map((h, i) => (
                        <th
                          key={h || i}
                          className={`px-2 pb-2 text-[0.6875rem] font-semibold tracking-wide uppercase ${
                            i >= 2 && i <= 5 ? 'text-right' : 'text-left'
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.map((p) => (
                      <tr
                        key={p.id}
                        className="transition-colors hover:bg-[var(--field-bg)]"
                        style={{ borderTop: '1px solid var(--hairline)' }}
                      >
                        <td className="px-2 py-2.5 font-medium" style={{ color: 'var(--text-strong)' }}>
                          {labelPeriode(p.run.period)}
                        </td>
                        <td className="px-2 py-2.5">
                          <StatusChip status={p.run.status} />
                        </td>
                        <td className="tnum px-2 py-2.5 text-right text-[0.8125rem]">{rupiah(p.grossPay)}</td>
                        <td className="tnum px-2 py-2.5 text-right text-[0.8125rem]">{rupiah(p.pph21)}</td>
                        <td
                          className="tnum px-2 py-2.5 text-right text-[0.8125rem]"
                          style={{ color: 'var(--color-clay-500)' }}
                        >
                          −{rupiah(p.totalDeduction)}
                        </td>
                        <td
                          className="tnum px-2 py-2.5 text-right text-[0.8125rem] font-semibold"
                          style={{ color: 'var(--text-strong)' }}
                        >
                          {rupiah(p.netPay)}
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <Link href={`/payslip/${p.id}`} className="btn btn-ghost btn-sm">
                            Slip
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>

        {/* ── sisi kanan ── */}
        <div className="space-y-4">
          <GlassCard>
            <SectionTitle title="Informasi" />
            <dl className="space-y-3">
              <Info icon={<Mail size={13} />} label="Surel" value={employee.email} />
              <Info icon={<Phone size={13} />} label="Telepon" value={employee.phone ?? '—'} />
              <Info
                icon={<CalendarDays size={13} />}
                label="Bergabung"
                value={tanggalPanjang(employee.joinDate)}
              />
              <Info
                icon={<Building2 size={13} />}
                label="Departemen"
                value={employee.department?.name ?? '—'}
              />
              <Info icon={<MapPin size={13} />} label="Alamat" value={employee.address ?? '—'} />
              <Info
                icon={<CreditCard size={13} />}
                label="Rekening"
                value={
                  employee.bankAccount ? `${employee.bankName ?? ''} ${employee.bankAccount}` : '—'
                }
              />
              <Info icon={<Banknote size={13} />} label="NPWP" value={employee.npwp ?? 'Tidak ada'} />
              <Info
                icon={<ShieldCheck size={13} />}
                label="Status PTKP"
                value={PTKP_LABEL[employee.ptkpStatus as PtkpStatus] ?? employee.ptkpStatus}
              />
            </dl>
          </GlassCard>

          <GlassCard>
            <SectionTitle title={`Kehadiran ${labelPeriode(period)}`} />
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                ['Hadir', hadir, 'var(--color-jade-500)'],
                ['Cuti', cuti, 'var(--text-body)'],
                ['Mangkir', mangkir, 'var(--color-clay-500)'],
              ].map(([l, v, c]) => (
                <div key={String(l)} className="glass-thin py-2.5">
                  <p className="tnum text-lg font-semibold" style={{ color: String(c) }}>
                    {String(v)}
                  </p>
                  <p className="text-[0.625rem]" style={{ color: 'var(--text-muted)' }}>
                    {String(l)}
                  </p>
                </div>
              ))}
            </div>
            {totalTelat > 0 && (
              <p className="mt-3 text-[0.75rem]" style={{ color: 'var(--color-brass-500)' }}>
                Akumulasi keterlambatan {jamMenit(totalTelat)} bulan ini.
              </p>
            )}
          </GlassCard>

          <GlassCard>
            <SectionTitle title="Kuota cuti tahunan" />
            <div className="flex items-baseline justify-between">
              <span className="tnum text-2xl font-semibold" style={{ color: 'var(--text-strong)' }}>
                {employee.annualLeaveQuota - cutiTerpakai}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                dari {employee.annualLeaveQuota} hari
              </span>
            </div>
            <div className="mt-2">
              <MiniBar value={cutiTerpakai} max={employee.annualLeaveQuota} tone="brass" />
            </div>
            <p className="mt-1.5 text-[0.6875rem]" style={{ color: 'var(--text-muted)' }}>
              {cutiTerpakai} hari terpakai tahun {y}
            </p>

            {leaves.length > 0 && (
              <ul className="mt-4 space-y-2 border-t pt-3" style={{ borderColor: 'var(--hairline)' }}>
                {leaves.slice(0, 4).map((l) => (
                  <li key={l.id} className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block text-[0.75rem]" style={{ color: 'var(--text-body)' }}>
                        {statusLabel(l.type)} · {l.days} hari
                      </span>
                      <span className="block text-[0.625rem]" style={{ color: 'var(--text-muted)' }}>
                        {tanggal(l.startDate)}
                      </span>
                    </span>
                    <StatusChip status={l.status} />
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          {loans.length > 0 && (
            <GlassCard>
              <SectionTitle title="Pinjaman" />
              <ul className="space-y-2.5">
                {loans.map((l) => (
                  <li key={l.id} className="glass-thin px-3 py-2.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="tnum text-[0.8125rem] font-medium" style={{ color: 'var(--text-strong)' }}>
                        {rupiah(l.principal)}
                      </span>
                      <StatusChip status={l.status === 'ACTIVE' ? 'PENDING' : 'PAID'} />
                    </div>
                    <p className="mt-1 text-[0.6875rem]" style={{ color: 'var(--text-muted)' }}>
                      {l.tenorMonths} bulan · potong {rupiah(l.monthlyDeduction)}/bulan
                    </p>
                    <div className="mt-1.5">
                      <MiniBar value={l.principal - l.remaining} max={l.principal} />
                    </div>
                    <p className="mt-1 text-[0.625rem]" style={{ color: 'var(--text-muted)' }}>
                      Sisa {rupiah(l.remaining)}
                    </p>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-[3px] shrink-0" style={{ color: 'var(--text-muted)' }}>
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[0.625rem] tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
          {label}
        </dt>
        <dd className="text-[0.8125rem] break-words" style={{ color: 'var(--text-body)' }}>
          {value}
        </dd>
      </div>
    </div>
  );
}
