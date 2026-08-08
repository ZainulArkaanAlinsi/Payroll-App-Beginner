import Link from 'next/link';
import { OctagonX, Scale, TriangleAlert } from 'lucide-react';
import { GlassCard, SectionTitle, Chip } from '@/components/ui/Glass';
import type { TemuanKepatuhan } from '@/lib/kepatuhan';

/**
 * Temuan kepatuhan ketenagakerjaan.
 *
 * Dua aturan di bawah tidak pernah menimbulkan galat di sistem mana pun —
 * gajinya tetap terhitung dan terbayar — dan baru jadi masalah ketika ada
 * pemeriksaan. Karena itu ditampilkan menetap di halaman data karyawan,
 * bukan disembunyikan di laporan yang jarang dibuka.
 */
export default function KepatuhanPanel({ temuan }: { temuan: TemuanKepatuhan[] }) {
  const pelanggaran = temuan.filter((t) => t.tingkat === 'PELANGGARAN');

  return (
    <GlassCard
      style={{
        borderColor:
          pelanggaran.length > 0
            ? 'color-mix(in srgb, var(--color-clay-500) 34%, transparent)'
            : 'color-mix(in srgb, var(--color-brass-500) 30%, transparent)',
      }}
    >
      <SectionTitle
        title="Kepatuhan ketenagakerjaan"
        subtitle="Ditemukan dari struktur upah yang berlaku saat ini"
        action={
          pelanggaran.length > 0 ? (
            <Chip tone="clay" dot>
              {pelanggaran.length} pelanggaran
            </Chip>
          ) : (
            <Chip tone="brass" dot>
              perlu ditinjau
            </Chip>
          )
        }
      />

      <ul className="space-y-2.5">
        {temuan.map((t) => {
          const berat = t.tingkat === 'PELANGGARAN';
          return (
            <li key={t.kode} className="glass-thin px-4 py-3.5">
              <div className="flex items-start gap-3">
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-lg"
                  style={{
                    background: berat ? 'rgb(168 90 79 / .15)' : 'rgb(168 127 52 / .15)',
                    color: berat ? 'var(--color-clay-500)' : 'var(--color-brass-500)',
                  }}
                >
                  {berat ? <OctagonX size={15} /> : <TriangleAlert size={15} />}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="t-heading">{t.judul}</p>

                  {/* Dasar hukumnya disebut supaya HR bisa memeriksa sendiri,
                      bukan sekadar percaya pada peringatan sistem. */}
                  <p className="mt-1 flex items-start gap-1.5 t-micro leading-snug">
                    <Scale size={11} className="mt-0.5 shrink-0" />
                    {t.dasar}
                  </p>

                  <ul className="mt-2.5 space-y-1">
                    {t.terdampak.map((d) => (
                      <li key={d.id}>
                        <Link
                          href={`/employees/${d.id}`}
                          className="flex flex-wrap items-baseline gap-x-2 hover:underline"
                        >
                          <span className="t-small" style={{ color: 'var(--text-strong)', fontWeight: 550 }}>
                            {d.nama}
                          </span>
                          <span className="t-micro">{d.catatan}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
