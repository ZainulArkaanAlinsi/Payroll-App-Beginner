import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, Banknote, Building2, CalendarDays, CreditCard, Mail,
  MapPin, Phone, Receipt, ShieldCheck, Trash2,
} from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { KartuBank } from '@/components/ui/KartuBank';
import { calculatePayroll, workingDaysInPeriod, type TaxMethod } from '@/lib/payroll-engine';
import { resolveAll, buildVariables } from '@/lib/components';
import { pilihAturan, lateConfigDari, overtimeConfigDari, type PolicyRow } from '@/lib/policy';
import { PTKP_LABEL, type PtkpStatus } from '@/lib/tax';
import { jamMenit, labelPeriode, periodeSekarang, rupiah, tanggal, tanggalPanjang } from '@/lib/format';
import {
  Avatar, Chip, EmptyState, GlassCard, MiniBar, SectionTitle, StatusChip, statusLabel,
} from '@/components/ui/Glass';
import { ActionButton } from '@/components/ui/Feedback';
import Tabs from '@/components/ui/Tabs';
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

  const [departments, positions, allComponents, payslips, attendance, leaves, loans, setting, policies] =
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
      prisma.policyRule.findMany({ where: { active: true } }),
    ]);

  const hadir = attendance.filter((a) => ['PRESENT', 'LATE', 'WFH'].includes(a.status)).length;
  const mangkir = attendance.filter((a) => a.status === 'ABSENT').length;
  const cuti = attendance.filter((a) => a.status === 'LEAVE').length;
  const totalTelat = attendance.reduce((s, a) => s + a.lateMinutes, 0);
  // pinjaman terlama — sama dengan yang dipakai mesin penggajian
  const pinjamanAktif = loans.filter((l) => l.status === 'ACTIVE').sort((a, b) => +a.createdAt - +b.createdAt)[0];

  // Simulasi memakai resolver yang sama dengan proses gaji sungguhan,
  // supaya angka pratinjau di sini tidak pernah berbeda dengan hasil akhir.
  const { lines, errors: galatRumus } = resolveAll(employee.components, {
    departmentId: employee.departmentId,
    level: employee.position?.level ?? null,
    baseSalary: employee.baseSalary,
    variables: buildVariables({
      baseSalary: employee.baseSalary,
      fixedAllowance: 0,
      workingDays: workingDaysInPeriod(period),
      presentDays: hadir,
      absentDays: mangkir,
      leaveDays: cuti,
      overtimeHours: 0,
      overtimeHolidayHours: 0,
      lateMinutes: totalTelat,
      monthsOfService: Math.max(
        0,
        (y - employee.joinDate.getFullYear()) * 12 + (m - 1 - employee.joinDate.getMonth()),
      ),
      dependents: Number(employee.ptkpStatus.split('/')[1] ?? 0),
      paidDays: workingDaysInPeriod(period),
    }),
  });

  const simulasi = calculatePayroll({
    employeeId: employee.id,
    fullName: employee.fullName,
    baseSalary: employee.baseSalary,
    ptkpStatus: employee.ptkpStatus as PtkpStatus,
    hasNpwp: Boolean(employee.npwp),
    taxMethod: employee.taxMethod as TaxMethod,
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
    cutAbsent: setting?.absentCutPerDay ?? true,
    latePolicy: lateConfigDari(
      pilihAturan(policies as PolicyRow[], 'LATE', employee.departmentId, employee.position?.level ?? null),
    ),
    overtimePolicy: overtimeConfigDari(
      pilihAturan(policies as PolicyRow[], 'OVERTIME', employee.departmentId, employee.position?.level ?? null),
    ),
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

  // Masa kerja dalam kata — HR lebih sering butuh ini daripada tanggalnya
  const bulanKerja = Math.max(
    0,
    (new Date().getFullYear() - employee.joinDate.getFullYear()) * 12 +
      (new Date().getMonth() - employee.joinDate.getMonth()),
  );
  const masaKerja =
    bulanKerja >= 12
      ? `${Math.floor(bulanKerja / 12)} tahun${bulanKerja % 12 ? ` ${bulanKerja % 12} bulan` : ''}`
      : `${bulanKerja} bulan`;

  const sisaCuti = employee.annualLeaveQuota - cutiTerpakai;
  const dicatat = hadir + cuti + mangkir;
  const skorDisiplin = dicatat > 0 ? (hadir / dicatat) * 100 : 0;
  const pinjamanBerjalan = loans.filter((l) => l.status === 'ACTIVE');

  // ── Panel: Ringkasan ──
  const panelRingkasan = (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
      <GlassCard>
        <SectionTitle
          title={`Simulasi gaji ${labelPeriode(period)}`}
          subtitle="Dihitung mesin yang sama dengan proses gaji sungguhan, memakai kehadiran bulan berjalan"
          action={<Chip tone="jade">langsung</Chip>}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <RincianKolom
            judul="Penerimaan"
            baris={penerimaan}
            total={simulasi.grossPay}
            totalLabel="Bruto"
          />
          <RincianKolom
            judul="Potongan"
            baris={potongan}
            total={simulasi.totalDeduction}
            totalLabel="Total potongan"
            negatif
          />
        </div>

        <div
          className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl px-4 py-3.5"
          style={{ background: 'var(--accent-soft)' }}
        >
          <div>
            <p className="label !mb-0.5">Perkiraan diterima</p>
            <p className="t-money-lg">{rupiah(simulasi.netPay)}</p>
          </div>
          <div className="text-right">
            <p className="label !mb-0.5">Biaya perusahaan</p>
            <p className="t-money">{rupiah(simulasi.employerCost)}</p>
            <p className="t-micro">
              PPh 21 {simulasi.taxMethod === 'TER' ? `TER ${simulasi.terRate}%` : 'progresif'}
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle title="Data pribadi" />
        <dl className="space-y-3">
          <Info icon={<Mail size={13} />} label="Surel" value={employee.email} />
          <Info icon={<Phone size={13} />} label="Telepon" value={employee.phone ?? '—'} />
          <Info icon={<MapPin size={13} />} label="Alamat" value={employee.address ?? '—'} />
          <Info
            icon={<CalendarDays size={13} />}
            label="Bergabung"
            value={`${tanggalPanjang(employee.joinDate)} · ${masaKerja}`}
          />
          <Info
            icon={<Building2 size={13} />}
            label="Departemen"
            value={employee.department?.name ?? '—'}
          />
          <Info icon={<CreditCard size={13} />} label="NIK" value={employee.nik ?? '—'} />
        </dl>
      </GlassCard>
    </div>
  );

  // ── Panel: Kompensasi ──
  const panelKompensasi = (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
      <GlassCard>
        <SectionTitle
          title="Komponen gaji melekat"
          subtitle="Centang untuk menempelkan komponen — berlaku pada perhitungan berikutnya"
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

      <div className="flex flex-col gap-3">
        <GlassCard>
          <SectionTitle title="Pajak & rekening" />
          <dl className="space-y-3">
            <Info
              icon={<ShieldCheck size={13} />}
              label="Status PTKP"
              value={PTKP_LABEL[employee.ptkpStatus as PtkpStatus] ?? employee.ptkpStatus}
            />
            <Info
              icon={<Banknote size={13} />}
              label="NPWP"
              value={employee.npwp ?? 'Belum terdaftar'}
            />
          </dl>

          {/* Kartu rekening gaji — persis yang dilihat karyawan di ponselnya.
              Mengubah nomor rekening di halaman ini mengubah kartu itu juga. */}
          <div className="mt-4">
            <KartuBank
              bank={employee.bankName}
              nomor={employee.bankAccount}
              pemilik={employee.bankHolder ?? employee.fullName}
            />
          </div>
          {!employee.npwp && (
            <p
              className="mt-3 rounded-lg px-3 py-2 t-micro"
              style={{ background: 'rgb(168 127 52 / .14)', color: 'var(--color-brass-500)' }}
            >
              Tanpa NPWP, PPh 21 karyawan ini dipotong 20% lebih tinggi dari seharusnya.
            </p>
          )}
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Pinjaman" />
          {loans.length === 0 ? (
            <p className="t-micro">Tidak ada pinjaman tercatat.</p>
          ) : (
            <ul className="space-y-2.5">
              {loans.map((l) => (
                <li key={l.id} className="glass-thin px-3.5 py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="t-money">{rupiah(l.principal)}</span>
                    <StatusChip status={l.status === 'ACTIVE' ? 'PENDING' : 'PAID'} />
                  </div>
                  <p className="mt-1 t-micro">
                    {l.tenorMonths} bulan · potong {rupiah(l.monthlyDeduction)}/bulan
                  </p>
                  <div className="mt-2">
                    <MiniBar value={l.principal - l.remaining} max={l.principal} />
                  </div>
                  <p className="mt-1 t-micro">Sisa {rupiah(l.remaining)}</p>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </div>
  );

  // ── Panel: Kehadiran & cuti ──
  const panelKehadiran = (
    <div className="grid gap-3 xl:grid-cols-2">
      <GlassCard>
        <SectionTitle title={`Kehadiran ${labelPeriode(period)}`} subtitle="Rekap bulan berjalan" />
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            ['Hadir', hadir, 'var(--color-jade-500)'],
            ['Cuti', cuti, 'var(--text-body)'],
            ['Mangkir', mangkir, 'var(--color-clay-500)'],
          ].map(([l, v, c]) => (
            <div key={String(l)} className="glass-thin py-3">
              <p className="tnum text-lg font-semibold" style={{ color: String(c) }}>
                {String(v)}
              </p>
              <p className="t-micro">{String(l)}</p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="t-label">Kedisiplinan</span>
            <span className="tnum t-label" style={{ color: 'var(--text-strong)' }}>
              {skorDisiplin.toFixed(0)}%
            </span>
          </div>
          <MiniBar
            value={skorDisiplin}
            max={100}
            tone={skorDisiplin >= 90 ? 'jade' : skorDisiplin >= 75 ? 'brass' : 'clay'}
          />
        </div>

        {totalTelat > 0 && (
          <p className="mt-3 t-micro" style={{ color: 'var(--color-brass-500)' }}>
            Akumulasi keterlambatan {jamMenit(totalTelat)} bulan ini.
          </p>
        )}
      </GlassCard>

      <GlassCard>
        <SectionTitle
          title="Cuti"
          subtitle={`Sisa ${sisaCuti} dari ${employee.annualLeaveQuota} hari pada ${y}`}
        />
        <MiniBar value={cutiTerpakai} max={employee.annualLeaveQuota} tone="brass" />

        {leaves.length === 0 ? (
          <p className="mt-4 t-micro">Belum ada pengajuan cuti.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {leaves.map((l) => (
              <li key={l.id} className="flex items-start justify-between gap-2">
                <span className="min-w-0">
                  <span className="block t-label" style={{ color: 'var(--text-body)' }}>
                    {statusLabel(l.type)} · {l.days} hari
                  </span>
                  <span className="block t-micro">
                    {tanggal(l.startDate)} – {tanggal(l.endDate)}
                  </span>
                </span>
                <StatusChip status={l.status} />
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );

  // ── Panel: Riwayat gaji ──
  const panelRiwayat = (
    <GlassCard>
      <SectionTitle title="Riwayat slip gaji" subtitle="Delapan periode terakhir" />
      {payslips.length === 0 ? (
        <EmptyState
          icon={<Receipt size={18} />}
          title="Belum ada slip gaji"
          hint="Slip terbit setelah proses gaji periode terkait disetujui."
        />
      ) : (
        <div className="tbl-scroll scroll-slim">
          <table className="tbl" style={{ minWidth: 620 }}>
            <thead>
              <tr>
                <th>Periode</th>
                <th>Status</th>
                <th className="text-right">Bruto</th>
                <th className="text-right">PPh 21</th>
                <th className="text-right">Potongan</th>
                <th className="text-right">Diterima</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {payslips.map((p) => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--text-strong)', fontWeight: 550 }}>
                    {labelPeriode(p.run.period)}
                  </td>
                  <td>
                    <StatusChip status={p.run.status} />
                  </td>
                  <td className="text-right">{rupiah(p.grossPay)}</td>
                  <td className="text-right" style={{ color: 'var(--color-clay-500)' }}>
                    −{rupiah(p.pph21)}
                  </td>
                  <td className="text-right" style={{ color: 'var(--color-clay-500)' }}>
                    −{rupiah(p.totalDeduction)}
                  </td>
                  <td className="text-right">{rupiah(p.netPay)}</td>
                  <td className="text-right">
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
  );

  return (
    <div className="page">
      <Link
        href="/employees"
        className="inline-flex items-center gap-1.5 t-label"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={13} />
        Kembali ke daftar karyawan
      </Link>

      {/* ── Kepala: identitas & aksi ── */}
      <GlassCard className="!p-0">
        <div className="flex flex-wrap items-start justify-between gap-5 px-6 pt-6 pb-5">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={employee.fullName} size={64} />
            <div className="min-w-0">
              <h1 className="t-display" style={{ fontSize: '1.5rem' }}>
                {employee.fullName}
              </h1>
              <p className="mt-0.5 t-small">
                {employee.position?.title ?? 'Tanpa posisi'}
                {employee.department && ` · ${employee.department.name}`}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <StatusChip status={employee.status} />
                <Chip tone="info">{statusLabel(employee.employmentType)}</Chip>
                <Chip tone="neutral">{employee.employeeNo}</Chip>
                {!employee.npwp && <Chip tone="brass">tanpa NPWP</Chip>}
              </div>
            </div>
          </div>

          <div className="page-head-actions">
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
                confirmTitle={`Hapus ${employee.fullName} dari daftar karyawan?`}
                confirmLabel="Hapus karyawan"
                confirm={
                  payslips.length > 0
                    ? 'Karyawan ini sudah punya riwayat gaji, jadi datanya tidak dihapus — statusnya diubah menjadi mengundurkan diri agar arsip slip tetap utuh.'
                    : 'Karyawan ini belum punya riwayat gaji, jadi datanya dihapus permanen beserta akun masuknya.'
                }
              >
                <Trash2 size={13} />
                Hapus
              </ActionButton>
            )}
          </div>
        </div>

        {/* Empat angka yang paling sering dicari HR saat membuka satu karyawan */}
        <div
          className="grid grid-cols-2 border-t lg:grid-cols-4"
          style={{ borderColor: 'var(--hairline)' }}
        >
          <Ringkas label="Gaji pokok" nilai={rupiah(employee.baseSalary)} />
          <Ringkas
            label="Perkiraan diterima"
            nilai={rupiah(simulasi.netPay)}
            catatan={labelPeriode(period)}
            sorot
          />
          <Ringkas
            label="Sisa cuti"
            nilai={`${sisaCuti} hari`}
            catatan={`dari ${employee.annualLeaveQuota} hari`}
          />
          <Ringkas
            label="Masa kerja"
            nilai={masaKerja}
            catatan={
              pinjamanBerjalan.length > 0 ? `${pinjamanBerjalan.length} pinjaman berjalan` : undefined
            }
          />
        </div>
      </GlassCard>

      <Tabs
        tabs={[
          { key: 'ringkasan', label: 'Ringkasan' },
          { key: 'kompensasi', label: 'Kompensasi', count: employee.components.length },
          { key: 'kehadiran', label: 'Kehadiran & cuti' },
          { key: 'riwayat', label: 'Riwayat gaji', count: payslips.length },
        ]}
        panels={{
          ringkasan: panelRingkasan,
          kompensasi: panelKompensasi,
          kehadiran: panelKehadiran,
          riwayat: panelRiwayat,
        }}
      />
    </div>
  );
}

/** Satu angka pada bilah ringkas di kepala halaman. */
function Ringkas({
  label,
  nilai,
  catatan,
  sorot,
}: {
  label: string;
  nilai: string;
  catatan?: string;
  sorot?: boolean;
}) {
  return (
    <div
      className="px-6 py-4"
      style={{
        borderRight: '1px solid var(--hairline)',
        background: sorot ? 'var(--accent-soft)' : undefined,
      }}
    >
      <p className="label !mb-1">{label}</p>
      <p className="t-money" style={{ fontSize: '1rem' }}>
        {nilai}
      </p>
      {catatan && <p className="t-micro">{catatan}</p>}
    </div>
  );
}

/** Kolom rincian pada simulasi gaji. */
function RincianKolom({
  judul,
  baris,
  total,
  totalLabel,
  negatif,
}: {
  judul: string;
  baris: { label: string; amount: number; note?: string }[];
  total: number;
  totalLabel: string;
  negatif?: boolean;
}) {
  return (
    <div>
      <p className="label">{judul}</p>
      <ul className="space-y-1.5">
        {baris.map((r, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 t-small">
              {r.label}
              {r.note && <span className="block t-micro leading-snug">{r.note}</span>}
            </span>
            <span
              className="tnum shrink-0 t-small"
              style={{
                color: negatif ? 'var(--color-clay-500)' : 'var(--text-strong)',
                fontWeight: 550,
              }}
            >
              {negatif ? '−' : ''}
              {rupiah(r.amount)}
            </span>
          </li>
        ))}
        {baris.length === 0 && <li className="t-micro">Tidak ada.</li>}
      </ul>
      <div
        className="mt-2.5 flex items-baseline justify-between border-t pt-2.5"
        style={{ borderColor: 'var(--hairline)' }}
      >
        <span className="t-small" style={{ color: 'var(--text-strong)', fontWeight: 600 }}>
          {totalLabel}
        </span>
        <span
          className="tnum t-small"
          style={{
            color: negatif ? 'var(--color-clay-500)' : 'var(--text-strong)',
            fontWeight: 680,
          }}
        >
          {negatif ? '−' : ''}
          {rupiah(total)}
        </span>
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
        <dt className="t-micro tracking-wide uppercase">{label}</dt>
        <dd className="t-small break-words" style={{ color: 'var(--text-body)' }}>
          {value}
        </dd>
      </div>
    </div>
  );
}
