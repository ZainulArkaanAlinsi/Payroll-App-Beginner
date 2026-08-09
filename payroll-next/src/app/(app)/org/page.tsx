import Link from 'next/link';
import { Network, Trash2, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rupiah, rupiahRingkas } from '@/lib/format';
import { Chip, EmptyState, GlassCard, SectionTitle, statusLabel } from '@/components/ui/Glass';
import { ActionButton } from '@/components/ui/Feedback';
import { BarRank } from '@/components/ui/charts';
import { deleteDepartment, deletePosition } from '@/actions/org';
import { DepartmentDialog, PositionDialog } from './OrgDialogs';
import PanelUtama, { RingkasPanel } from '@/components/ui/PanelUtama';

export const metadata = { title: 'Organisasi' };

export default async function OrgPage() {
  const session = await requireRole('ADMIN', 'HR');
  const isAdmin = session.role === 'ADMIN';

  const departments = await prisma.department.findMany({
    orderBy: { code: 'asc' },
    include: {
      positions: {
        orderBy: { title: 'asc' },
        include: { _count: { select: { employees: true } } },
      },
      employees: { where: { status: 'ACTIVE' }, select: { baseSalary: true } },
    },
  });

  const ringkas = departments.map((d) => ({
    id: d.id,
    name: d.name,
    headcount: d.employees.length,
    payroll: d.employees.reduce((s, e) => s + e.baseSalary, 0),
  }));

  const totalKaryawan = ringkas.reduce((s, d) => s + d.headcount, 0);
  const totalPosisi = departments.reduce((s, d) => s + d.positions.length, 0);

  return (
    <div className="page">
      <PanelUtama
        judul="Organisasi"
        nilai={String(totalKaryawan)}
        nilaiLabel="karyawan aktif di dalam struktur"
        keterangan={`Departemen dan posisi menentukan kebijakan lembur serta pengelompokan biaya di laporan.`}
        anak={<DepartmentDialog />}
        samping={
          <div className="grid grid-cols-2 gap-2">
            <RingkasPanel nilai={String(departments.length)} label="departemen" />
            <RingkasPanel nilai={String(totalPosisi)} label="posisi" />
          </div>
        }
      />

      {ringkas.length > 0 && (
        <div className="grid gap-3 xl:grid-cols-2">
          <GlassCard>
            <SectionTitle title="Sebaran karyawan" subtitle="Jumlah karyawan aktif per departemen" />
            <BarRank
              colored
              data={ringkas.map((d, i) => ({ label: d.name, value: d.headcount, colorIndex: i }))}
              format="orang"
              tooltipFormat="orang"
            />
          </GlassCard>
          <GlassCard>
            <SectionTitle
              title="Beban gaji pokok"
              subtitle="Total gaji pokok bulanan per departemen, sebelum tunjangan"
            />
            <BarRank
              colored
              data={ringkas.map((d, i) => ({
                label: d.name,
                value: d.payroll,
                colorIndex: i,
                sub: d.headcount > 0 ? `rata-rata ${rupiahRingkas(d.payroll / d.headcount)}` : undefined,
              }))}
            />
          </GlassCard>
        </div>
      )}

      {departments.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={<Network size={18} />}
            title="Belum ada departemen"
            hint="Buat departemen dulu, lalu tambahkan posisi di dalamnya."
          />
        </GlassCard>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {departments.map((d) => {
            const jumlah = d.employees.length;
            return (
              <GlassCard key={d.id} hover>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="t-heading font-semibold">{d.name}</h2>
                      <Chip tone="neutral">{d.code}</Chip>
                    </div>
                    <p className="mt-0.5 t-label" style={{ color: 'var(--text-muted)' }}>
                      {jumlah} karyawan · {d.positions.length} posisi
                      {d.costCenter && ` · ${d.costCenter}`}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <PositionDialog
                      departments={departments.map((x) => ({ id: x.id, name: x.name }))}
                      defaultDepartmentId={d.id}
                    />
                    <DepartmentDialog
                      department={{ id: d.id, code: d.code, name: d.name, costCenter: d.costCenter }}
                    />
                    {isAdmin && (
                      <ActionButton
                        action={deleteDepartment.bind(null, d.id)}
                        className="btn btn-danger btn-sm"
                        confirm={`Hapus departemen ${d.name}?`}
                      >
                        <Trash2 size={13} />
                      </ActionButton>
                    )}
                  </div>
                </div>

                {d.positions.length === 0 ? (
                  <p
                    className="glass-thin px-3 py-4 text-center t-label"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Belum ada posisi di departemen ini.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {d.positions.map((p) => (
                      <li
                        key={p.id}
                        className="glass-thin flex flex-wrap items-center gap-3 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="truncate t-small font-medium"
                              style={{ color: 'var(--text-strong)' }}
                            >
                              {p.title}
                            </span>
                            <Chip tone="info">{statusLabel(p.level)}</Chip>
                          </div>
                          <p className="tnum t-micro" style={{ color: 'var(--text-muted)' }}>
                            {p.maxSalary > 0
                              ? `${rupiah(p.minSalary)} – ${rupiah(p.maxSalary)}`
                              : 'rentang gaji belum diisi'}
                          </p>
                        </div>

                        <Link
                          href={`/employees?dept=${d.id}`}
                          className="flex items-center gap-1 t-micro"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Users size={12} />
                          {p._count.employees}
                        </Link>

                        <PositionDialog
                          departments={departments.map((x) => ({ id: x.id, name: x.name }))}
                          position={{
                            id: p.id,
                            title: p.title,
                            level: p.level,
                            departmentId: p.departmentId,
                            minSalary: p.minSalary,
                            maxSalary: p.maxSalary,
                          }}
                        />
                        {isAdmin && (
                          <ActionButton
                            action={deletePosition.bind(null, p.id)}
                            className="btn btn-danger btn-sm"
                            confirm={`Hapus posisi ${p.title}?`}
                          >
                            <Trash2 size={12} />
                          </ActionButton>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
