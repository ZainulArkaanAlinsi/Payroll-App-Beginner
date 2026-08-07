import Link from 'next/link';
import { ScrollText } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sejak, tanggalPanjang, jam } from '@/lib/format';
import { Avatar, Chip, EmptyState, GlassCard, SectionTitle } from '@/components/ui/Glass';
import TableToolbar from '@/components/ui/TableToolbar';

export const metadata = { title: 'Jejak Audit' };

const PAGE_SIZE = 40;

const AKSI_LABEL: Record<string, string> = {
  CREATE: 'Tambah',
  UPDATE: 'Ubah',
  DELETE: 'Hapus',
  APPROVE: 'Setujui',
  REJECT: 'Tolak',
  RUN: 'Proses',
  LOGIN: 'Masuk',
  LOGOUT: 'Keluar',
};

const AKSI_TONE: Record<string, 'jade' | 'brass' | 'clay' | 'info' | 'neutral'> = {
  CREATE: 'jade',
  APPROVE: 'jade',
  UPDATE: 'info',
  RUN: 'info',
  LOGIN: 'neutral',
  LOGOUT: 'neutral',
  REJECT: 'clay',
  DELETE: 'clay',
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole('ADMIN');
  const sp = await searchParams;
  const q = sp.q?.trim() ?? '';
  const action = sp.action ?? '';
  const entity = sp.entity ?? '';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  const where = {
    ...(action ? { action } : {}),
    ...(entity ? { entity } : {}),
    ...(q ? { OR: [{ summary: { contains: q } }, { actorName: { contains: q } }] } : {}),
  };

  const [logs, total, entities] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({ by: ['entity'], _count: true, orderBy: { entity: 'asc' } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => {
    const s = new URLSearchParams();
    if (q) s.set('q', q);
    if (action) s.set('action', action);
    if (entity) s.set('entity', entity);
    s.set('page', String(p));
    return `?${s.toString()}`;
  };

  // kelompokkan per tanggal supaya linimasa terbaca
  const perTanggal = new Map<string, typeof logs>();
  for (const l of logs) {
    const k = l.createdAt.toDateString();
    const arr = perTanggal.get(k) ?? [];
    arr.push(l);
    perTanggal.set(k, arr);
  }

  return (
    <div className="page">
      <div>
        <h1 className="t-display">
          Jejak audit
        </h1>
        <p className="mt-1 t-small">
          {total} catatan · setiap perubahan penting terekam beserta pelakunya
        </p>
      </div>

      <div className="page-narrow">
      <GlassCard>
        <SectionTitle title="Riwayat aktivitas" />
        <TableToolbar
          searchPlaceholder="Cari keterangan atau nama pelaku…"
          filters={[
            {
              name: 'action',
              label: 'Semua aksi',
              options: Object.entries(AKSI_LABEL).map(([v, l]) => ({ value: v, label: l })),
            },
            {
              name: 'entity',
              label: 'Semua objek',
              options: entities.map((e) => ({ value: e.entity, label: `${e.entity} (${e._count})` })),
            },
          ]}
        />

        {logs.length === 0 ? (
          <EmptyState icon={<ScrollText size={18} />} title="Tidak ada catatan yang cocok" />
        ) : (
          <div className="space-y-6">
            {[...perTanggal.entries()].map(([hari, items]) => (
              <div key={hari}>
                <p
                  className="mb-2.5 t-micro font-semibold tracking-[0.1em] uppercase"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {tanggalPanjang(new Date(hari))}
                </p>

                <ol className="relative space-y-3 pl-5">
                  {/* garis linimasa */}
                  <span
                    className="absolute top-1 bottom-1 left-[5px] w-px"
                    style={{ background: 'var(--hairline)' }}
                    aria-hidden
                  />
                  {items.map((l) => (
                    <li key={l.id} className="relative">
                      <span
                        className="absolute top-[7px] -left-5 size-[11px] rounded-full border-2"
                        style={{
                          background: 'var(--bg-base)',
                          borderColor: 'var(--accent)',
                        }}
                        aria-hidden
                      />
                      <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
                        <Avatar name={l.actorName} size={24} />
                        <div className="min-w-0 flex-1">
                          <p className="t-small" style={{ color: 'var(--text-body)' }}>
                            {l.summary}
                          </p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 t-micro" style={{ color: 'var(--text-muted)' }}>
                            <span>{l.actorName}</span>
                            <span>·</span>
                            <span className="tnum">{jam(l.createdAt)}</span>
                            <span>·</span>
                            <span>{sejak(l.createdAt)}</span>
                          </p>
                        </div>
                        <span className="flex shrink-0 items-center gap-1.5">
                          <Chip tone={AKSI_TONE[l.action] ?? 'neutral'}>
                            {AKSI_LABEL[l.action] ?? l.action}
                          </Chip>
                          <Chip tone="neutral">{l.entity}</Chip>
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div
            className="mt-5 flex items-center justify-between border-t pt-3 t-label"
            style={{ borderColor: 'var(--hairline)' }}
          >
            <span style={{ color: 'var(--text-muted)' }}>
              Halaman {page} dari {pages}
            </span>
            <div className="page-head-actions">
              <Link
                href={qs(page - 1)}
                className="btn btn-ghost btn-sm"
                style={{ pointerEvents: page <= 1 ? 'none' : undefined, opacity: page <= 1 ? 0.4 : 1 }}
              >
                Sebelumnya
              </Link>
              <Link
                href={qs(page + 1)}
                className="btn btn-ghost btn-sm"
                style={{
                  pointerEvents: page >= pages ? 'none' : undefined,
                  opacity: page >= pages ? 0.4 : 1,
                }}
              >
                Berikutnya
              </Link>
            </div>
          </div>
        )}
      </GlassCard>
      </div>
    </div>
  );
}
