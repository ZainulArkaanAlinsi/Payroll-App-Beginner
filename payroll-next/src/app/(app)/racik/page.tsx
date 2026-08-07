import { ArrowDown, ArrowUp, Star, Trash2 } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rupiah } from '@/lib/format';
import { lateConfigDari, overtimeConfigDari, LEVEL_PILIHAN, type PolicyRow } from '@/lib/policy';
import { Chip, EmptyState, GlassCard, SectionTitle } from '@/components/ui/Glass';
import { ActionButton } from '@/components/ui/Feedback';
import { deletePolicy, deleteStep, moveStep, deleteBankFormat } from '@/actions/racik';
import RacikTabs from './RacikTabs';
import { PolicyDialog, StepDialog, BankDialog } from './Dialogs';
import PayslipFields from './PayslipFields';

export const metadata = { title: 'Racik' };

const LEVEL_LABEL = Object.fromEntries(LEVEL_PILIHAN);

export default async function RacikPage() {
  const session = await requireRole('ADMIN', 'HR');
  const isAdmin = session.role === 'ADMIN';

  const [policies, steps, fields, formats, departments] = await Promise.all([
    prisma.policyRule.findMany({ orderBy: [{ kind: 'asc' }, { priority: 'desc' }] }),
    prisma.approvalStep.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.payslipField.findMany({ orderBy: [{ section: 'asc' }, { sortOrder: 'asc' }] }),
    prisma.bankFormat.findMany({ orderBy: [{ isDefault: 'desc' }, { name: 'asc' }] }),
    prisma.department.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  const deptName = new Map(departments.map((d) => [d.id, d.name]));

  const cakupan = (p: { scopeDepartmentId: string | null; scopeLevel: string | null }) => {
    const bagian: string[] = [];
    if (p.scopeDepartmentId) bagian.push(deptName.get(p.scopeDepartmentId) ?? 'Departemen terhapus');
    if (p.scopeLevel) bagian.push(LEVEL_LABEL[p.scopeLevel] ?? p.scopeLevel);
    return bagian.length ? bagian.join(' · ') : 'Semua karyawan';
  };

  const kartuAturan = (jenis: 'LATE' | 'OVERTIME') => {
    const daftar = policies.filter((p) => p.kind === jenis);
    return (
      <GlassCard>
        <SectionTitle
          title={jenis === 'LATE' ? 'Aturan keterlambatan' : 'Aturan lembur'}
          subtitle={
            jenis === 'LATE'
              ? 'Toleransi dan denda boleh berbeda antar divisi'
              : 'Pengganda resmi atau tarif rata, per divisi'
          }
          action={<PolicyDialog departments={departments} defaultKind={jenis} />}
        />

        {daftar.length === 0 ? (
          <EmptyState
            title="Belum ada aturan"
            hint="Tanpa aturan, komponen ini tidak menghasilkan potongan atau upah apa pun."
          />
        ) : (
          <ul className="space-y-2">
            {daftar.map((p) => {
              const late = lateConfigDari(p as PolicyRow);
              const ot = overtimeConfigDari(p as PolicyRow);
              return (
                <li key={p.id} className="glass-thin px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="t-heading">{p.name}</span>
                        {!p.active && <Chip tone="clay">nonaktif</Chip>}
                        {(p.scopeDepartmentId || p.scopeLevel) && (
                          <Chip tone="info">khusus</Chip>
                        )}
                      </div>
                      <p className="t-micro mt-0.5">
                        {cakupan(p)} · prioritas {p.priority}
                      </p>

                      <p className="t-label mt-1.5" style={{ color: 'var(--text-body)' }}>
                        {jenis === 'LATE' ? (
                          late.potonganPerMenit === 0 ? (
                            'Tanpa potongan — dikecualikan'
                          ) : (
                            <>
                              Toleransi {late.toleransiMenit} menit, lalu{' '}
                              {rupiah(late.potonganPerMenit)}/menit
                              {late.potonganMaksPerBulan > 0 &&
                                `, maksimal ${rupiah(late.potonganMaksPerBulan)}/bulan`}
                            </>
                          )
                        ) : ot.metode === 'FLAT' ? (
                          `Tarif rata ${rupiah(ot.tarifPerJam ?? 0)} per jam`
                        ) : (
                          `Kepmenaker — upah sejam = upah sebulan ÷ ${ot.pembagi ?? 173}`
                        )}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-1.5">
                      <PolicyDialog departments={departments} policy={p as PolicyRow} />
                      {isAdmin && (
                        <ActionButton
                          action={deletePolicy.bind(null, p.id)}
                          className="btn btn-danger btn-sm"
                          confirm={`Hapus aturan "${p.name}"?`}
                        >
                          <Trash2 size={12} />
                        </ActionButton>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>
    );
  };

  const panelAturan = (
    <div className="grid gap-3 xl:grid-cols-2">
      {kartuAturan('LATE')}
      {kartuAturan('OVERTIME')}
    </div>
  );

  const aktifSteps = steps.filter((s) => s.active);
  const panelAlur = (
    <GlassCard>
      <SectionTitle
        title="Alur persetujuan payroll"
        subtitle={
          aktifSteps.length === 0
            ? 'Belum ada tahap — persetujuan berjalan sekali klik oleh administrator'
            : `${aktifSteps.length} tahap aktif, dilalui berurutan dari atas ke bawah`
        }
        action={isAdmin ? <StepDialog /> : undefined}
      />

      {steps.length === 0 ? (
        <EmptyState
          title="Belum ada tahap persetujuan"
          hint="Tanpa tahap, satu klik administrator langsung menyetujui seluruh periode."
        />
      ) : (
        <ol className="relative space-y-2 pl-6">
          <span
            className="absolute top-3 bottom-3 left-[9px] w-px"
            style={{ background: 'var(--hairline)' }}
            aria-hidden
          />
          {steps.map((s, i) => (
            <li key={s.id} className="relative">
              <span
                className="tnum absolute top-3.5 -left-6 grid size-[19px] place-items-center rounded-full t-micro font-bold"
                style={{
                  background: s.active ? 'var(--accent-soft)' : 'var(--field-bg)',
                  color: s.active ? 'var(--accent)' : 'var(--text-muted)',
                  border: '2px solid var(--bg-base)',
                }}
              >
                {i + 1}
              </span>

              <div className="glass-thin flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="t-heading">{s.name}</span>
                    <Chip tone={s.role === 'ADMIN' ? 'jade' : 'info'}>
                      {s.role === 'ADMIN' ? 'Administrator' : 'HRD'}
                    </Chip>
                    {!s.active && <Chip tone="clay">nonaktif</Chip>}
                  </div>
                  {s.note && <p className="t-micro mt-0.5">{s.note}</p>}
                </div>

                {isAdmin && (
                  <div className="flex shrink-0 gap-1.5">
                    <ActionButton
                      action={moveStep.bind(null, s.id, 'UP')}
                      className="btn btn-ghost btn-sm"
                    >
                      <ArrowUp size={12} />
                    </ActionButton>
                    <ActionButton
                      action={moveStep.bind(null, s.id, 'DOWN')}
                      className="btn btn-ghost btn-sm"
                    >
                      <ArrowDown size={12} />
                    </ActionButton>
                    <StepDialog step={s} />
                    <ActionButton
                      action={deleteStep.bind(null, s.id)}
                      className="btn btn-danger btn-sm"
                      confirm={`Hapus tahap "${s.name}" dari alur?`}
                    >
                      <Trash2 size={12} />
                    </ActionButton>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <p className="t-micro mt-4 border-t pt-3" style={{ borderColor: 'var(--hairline)' }}>
        Menghitung ulang periode akan menghapus persetujuan yang sudah diberikan — angkanya berubah,
        jadi seluruh tahap wajib meninjau ulang.
      </p>
    </GlassCard>
  );

  const panelSlip = (
    <GlassCard>
      <SectionTitle
        title="Susunan slip gaji"
        subtitle="Pilih baris apa saja yang tampil pada slip yang diterima karyawan"
      />
      <PayslipFields fields={fields} />
    </GlassCard>
  );

  const panelBank = (
    <GlassCard>
      <SectionTitle
        title="Format berkas transfer bank"
        subtitle="Susunan kolom dicocokkan dengan yang diminta bank, tanpa menunggu pembaruan sistem"
        action={<BankDialog />}
      />

      {formats.length === 0 ? (
        <EmptyState title="Belum ada format" />
      ) : (
        <ul className="space-y-2">
          {formats.map((f) => {
            let kolom: { header: string; source: string; prefix: string }[] = [];
            try {
              kolom = JSON.parse(f.columns);
            } catch {
              kolom = [];
            }
            return (
              <li key={f.id} className="glass-thin px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="t-heading">{f.name}</span>
                      {f.isDefault && (
                        <Chip tone="jade">
                          <Star size={9} />
                          bawaan
                        </Chip>
                      )}
                    </div>
                    <p className="t-micro mt-0.5">
                      {kolom.length} kolom · pemisah &ldquo;{f.delimiter}&rdquo; ·{' '}
                      {f.includeHeader ? 'dengan baris judul' : 'tanpa baris judul'}
                    </p>

                    {/* pratinjau susunan kolom */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {kolom.map((c, i) => (
                        <span
                          key={i}
                          className="rounded-md px-2 py-0.5 font-mono t-micro"
                          style={{ background: 'var(--field-bg)', color: 'var(--text-body)' }}
                        >
                          {c.header || '—'}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-1.5">
                    <BankDialog format={f} />
                    {isAdmin && (
                      <ActionButton
                        action={deleteBankFormat.bind(null, f.id)}
                        className="btn btn-danger btn-sm"
                        confirm={`Hapus format "${f.name}"?`}
                      >
                        <Trash2 size={12} />
                      </ActionButton>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">Racik</h1>
          <p className="mt-1 t-small">
            Empat hal yang biasanya harus dipesan ke vendor — di sini HR yang memegangnya.
          </p>
        </div>
      </div>

      <RacikTabs
        panels={{
          aturan: panelAturan,
          alur: panelAlur,
          slip: panelSlip,
          bank: panelBank,
        }}
      />
    </div>
  );
}
