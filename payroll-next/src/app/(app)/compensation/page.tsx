import Link from 'next/link';
import { CircleCheck, Layers, Trash2, UsersRound } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { periodeSekarang, rupiah, rupiahRingkas } from '@/lib/format';
import {
  Avatar, Chip, EmptyState, GlassCard, MiniBar, SectionTitle,
} from '@/components/ui/Glass';
import { ActionButton } from '@/components/ui/Feedback';
import { assignToAll, deleteComponent, settleLoan } from '@/actions/compensation';
import { ComponentDialog, LoanDialog } from './Dialogs';

export const metadata = { title: 'Komponen Gaji' };

export default async function CompensationPage() {
  const session = await requireRole('ADMIN', 'HR');
  const isAdmin = session.role === 'ADMIN';

  const [components, loans, employees, activeCount] = await Promise.all([
    prisma.salaryComponent.findMany({
      orderBy: [{ type: 'asc' }, { active: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { assignments: true } } },
    }),
    prisma.loan.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: { employee: { select: { id: true, fullName: true, employeeNo: true } } },
    }),
    prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { fullName: 'asc' },
      select: { id: true, fullName: true, employeeNo: true },
    }),
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
  ]);

  const tunjangan = components.filter((c) => c.type === 'ALLOWANCE');
  const potongan = components.filter((c) => c.type === 'DEDUCTION');
  const pinjamanAktif = loans.filter((l) => l.status === 'ACTIVE');
  const sisaPinjaman = pinjamanAktif.reduce((s, l) => s + l.remaining, 0);

  const kartu = (c: (typeof components)[number]) => (
    <li key={c.id}>
      <div
        className="glass-thin px-4 py-3"
        style={{ opacity: c.active ? 1 : 0.55 }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="t-body font-semibold" style={{ color: 'var(--text-strong)' }}>
                {c.name}
              </span>
              <Chip tone="neutral">{c.code}</Chip>
              {!c.active && <Chip tone="clay">nonaktif</Chip>}
              {c.isDefault && <Chip tone="jade">bawaan</Chip>}
              {c.type === 'ALLOWANCE' && !c.taxable && <Chip tone="info">bebas pajak</Chip>}
            </div>
            <p className="mt-1 t-micro" style={{ color: 'var(--text-muted)' }}>
              {c.calcType === 'PERCENT_OF_BASE'
                ? `${c.percent}% dari gaji pokok`
                : c.calcType === 'FORMULA'
                  ? 'dihitung dari rumus'
                  : 'nominal tetap per bulan'}
              {' · '}
              melekat pada {c._count.assignments} karyawan
              {c.note && ` · ${c.note}`}
            </p>
            <div className="mt-2 max-w-[14rem]">
              <MiniBar
                value={c._count.assignments}
                max={activeCount || 1}
                tone={c.type === 'ALLOWANCE' ? 'jade' : 'clay'}
              />
            </div>
          </div>

          <div className="text-right">
            <p
              className="tnum t-heading font-semibold"
              style={{ color: c.type === 'ALLOWANCE' ? 'var(--text-strong)' : 'var(--color-clay-500)' }}
            >
              {c.calcType === 'PERCENT_OF_BASE'
                ? `${c.percent}%`
                : c.calcType === 'FORMULA'
                  ? 'rumus'
                  : rupiah(c.amount)}
            </p>
            {c.calcType === 'FORMULA' && c.formula && (
              <code
                className="mt-0.5 block max-w-[15rem] truncate font-mono t-micro"
                style={{ color: 'var(--accent)' }}
                title={c.formula}
              >
                {c.formula}
              </code>
            )}
            <div className="mt-1.5 flex justify-end gap-1.5">
              {c.active && c._count.assignments < activeCount && (
                <ActionButton
                  action={assignToAll.bind(null, c.id)}
                  className="btn btn-ghost btn-sm"
                  confirm={`Terapkan “${c.name}” ke semua ${activeCount} karyawan aktif?`}
                >
                  <UsersRound size={12} />
                  Semua
                </ActionButton>
              )}
              <ComponentDialog
                component={{
                  id: c.id,
                  code: c.code,
                  name: c.name,
                  type: c.type,
                  calcType: c.calcType,
                  amount: c.amount,
                  percent: c.percent,
                  formula: c.formula,
                  taxable: c.taxable,
                  countsForBpjs: c.countsForBpjs,
                  prorate: c.prorate,
                  isDefault: c.isDefault,
                  active: c.active,
                  sortOrder: c.sortOrder,
                  note: c.note,
                }}
              />
              {isAdmin && (
                <ActionButton
                  action={deleteComponent.bind(null, c.id)}
                  className="btn btn-danger btn-sm"
                  confirm={`Hapus komponen ${c.name}? Bila masih dipakai karyawan, komponen hanya akan dinonaktifkan.`}
                >
                  <Trash2 size={12} />
                </ActionButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">
            Komponen gaji
          </h1>
          <p className="mt-1 t-small">
            {tunjangan.length} tunjangan · {potongan.length} potongan · {pinjamanAktif.length} pinjaman
            berjalan
          </p>
        </div>
        <div className="page-head-actions">
          <LoanDialog employees={employees} currentPeriod={periodeSekarang()} />
          <ComponentDialog />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <GlassCard>
          <SectionTitle
            title="Tunjangan"
            subtitle="Menambah penghasilan bruto karyawan"
          />
          {tunjangan.length === 0 ? (
            <EmptyState icon={<Layers size={18} />} title="Belum ada tunjangan" />
          ) : (
            <ul className="space-y-2">{tunjangan.map(kartu)}</ul>
          )}
        </GlassCard>

        <GlassCard>
          <SectionTitle
            title="Potongan"
            subtitle="Di luar BPJS dan PPh 21 yang sudah dihitung otomatis"
          />
          {potongan.length === 0 ? (
            <EmptyState icon={<Layers size={18} />} title="Belum ada potongan" />
          ) : (
            <ul className="space-y-2">{potongan.map(kartu)}</ul>
          )}
        </GlassCard>
      </div>

      <GlassCard>
        <SectionTitle
          title="Pinjaman karyawan"
          subtitle={
            sisaPinjaman > 0
              ? `Total sisa pinjaman berjalan ${rupiahRingkas(sisaPinjaman)}`
              : 'Tidak ada pinjaman berjalan'
          }
        />
        {loans.length === 0 ? (
          <EmptyState
            title="Belum ada pinjaman tercatat"
            hint="Cicilan yang dicatat di sini otomatis memotong gaji tiap periode."
          />
        ) : (
          <div className="tbl-scroll scroll-slim">
            <table className="tbl" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  {['Karyawan', 'Pokok', 'Tenor', 'Cicilan/bulan', 'Terbayar', 'Sisa', 'Status', ''].map(
                    (h, i) => (
                      <th
                        key={h || i}
                        className={`${
                          i >= 1 && i <= 5 ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {loans.map((l) => {
                  const terbayar = l.principal - l.remaining;
                  return (
                    <tr
                      key={l.id}
                    >
                      <td>
                        <Link
                          href={`/employees/${l.employee.id}`}
                          className="flex items-center gap-2.5"
                        >
                          <Avatar name={l.employee.fullName} size={28} />
                          <span className="min-w-0">
                            <span
                              className="block truncate t-small font-medium"
                              style={{ color: 'var(--text-strong)' }}
                            >
                              {l.employee.fullName}
                            </span>
                            <span
                              className="block truncate t-micro"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {l.note ?? l.employee.employeeNo}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="tnum text-right t-small">{rupiah(l.principal)}</td>
                      <td className="tnum text-right t-small">{l.tenorMonths} bln</td>
                      <td className="tnum text-right t-small">
                        {rupiah(l.monthlyDeduction)}
                      </td>
                      <td className="text-right">
                        <span className="tnum block t-small">{rupiah(terbayar)}</span>
                        <span className="mt-1 block w-24 justify-self-end">
                          <MiniBar value={terbayar} max={l.principal} />
                        </span>
                      </td>
                      <td
                        className="tnum text-right t-small font-semibold"
                        style={{ color: 'var(--text-strong)' }}
                      >
                        {rupiah(l.remaining)}
                      </td>
                      <td>
                        {l.status === 'ACTIVE' ? (
                          <Chip tone="brass" dot>
                            berjalan
                          </Chip>
                        ) : (
                          <Chip tone="jade" dot>
                            lunas
                          </Chip>
                        )}
                      </td>
                      <td className="text-right">
                        {l.status === 'ACTIVE' && (
                          <ActionButton
                            action={settleLoan.bind(null, l.id)}
                            className="btn btn-ghost btn-sm"
                            confirm={`Tandai pinjaman ${l.employee.fullName} sebagai lunas? Sisa ${rupiah(l.remaining)} akan dihapus dari potongan.`}
                          >
                            <CircleCheck size={12} />
                            Lunasi
                          </ActionButton>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
