'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { movePayslipField, togglePayslipField } from '@/actions/racik';
import { Toast } from '@/components/ui/Feedback';
import type { ActionState } from '@/lib/types';

const SECTION_LABEL: Record<string, string> = {
  IDENTITAS: 'Identitas karyawan',
  PENERIMAAN: 'Bagian penerimaan',
  POTONGAN: 'Bagian potongan',
  PAJAK: 'Dasar perhitungan pajak',
  PERUSAHAAN: 'Iuran ditanggung perusahaan',
  CATATAN: 'Catatan & penutup',
};

// Baris ini adalah tulang punggung slip; menyembunyikannya membuat dokumen
// kehilangan makna, jadi sengaja dikunci.
const WAJIB = new Set(['nama', 'rincian_terima', 'rincian_potong']);

interface Field {
  id: string;
  key: string;
  label: string;
  section: string;
  visible: boolean;
}

export default function PayslipFields({ fields }: { fields: Field[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();
  const [result, setResult] = useState<ActionState | null>(null);
  const router = useRouter();

  const jalankan = (id: string, fn: () => Promise<ActionState>) => {
    setPendingId(id);
    start(async () => {
      const s = await fn();
      setResult(s);
      setPendingId(null);
      router.refresh();
    });
  };

  const sections = [...new Set(fields.map((f) => f.section))];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((sec) => {
          const daftar = fields.filter((f) => f.section === sec);
          return (
            <div key={sec}>
              <p className="label">{SECTION_LABEL[sec] ?? sec}</p>
              <ul className="space-y-1.5">
                {daftar.map((f, i) => {
                  const dikunci = WAJIB.has(f.key);
                  const sibuk = pendingId === f.id;
                  return (
                    <li
                      key={f.id}
                      className="glass-thin flex items-center gap-2.5 px-3 py-2"
                      style={{
                        opacity: dikunci ? 0.75 : 1,
                        borderColor: f.visible
                          ? 'color-mix(in srgb, var(--accent) 30%, transparent)'
                          : undefined,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={f.visible}
                        disabled={dikunci || sibuk}
                        onChange={() => jalankan(f.id, () => togglePayslipField(f.id, !f.visible))}
                        className="size-4 shrink-0 rounded"
                        style={{
                          accentColor: 'var(--color-jade-600)',
                          cursor: dikunci ? 'not-allowed' : 'pointer',
                        }}
                        aria-label={`Tampilkan ${f.label}`}
                      />

                      <span className="min-w-0 flex-1">
                        <span className="block truncate t-small" style={{ color: 'var(--text-strong)' }}>
                          {f.label}
                        </span>
                        {dikunci && <span className="t-micro block">selalu tampil</span>}
                      </span>

                      {sibuk ? (
                        <LoaderCircle
                          size={14}
                          className="animate-spin"
                          style={{ color: 'var(--text-muted)' }}
                        />
                      ) : f.visible ? (
                        <Eye size={13} style={{ color: 'var(--accent)' }} />
                      ) : (
                        <EyeOff size={13} style={{ color: 'var(--text-muted)' }} />
                      )}

                      {/* Urutan hanya bisa digeser di dalam bagiannya sendiri. */}
                      {daftar.length > 1 && (
                        <span className="flex shrink-0 gap-0.5">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ width: 24, paddingInline: 0, opacity: i === 0 ? 0.3 : 1 }}
                            disabled={i === 0 || sibuk}
                            onClick={() => jalankan(f.id, () => movePayslipField(f.id, 'UP'))}
                            aria-label={`Naikkan ${f.label}`}
                          >
                            <ArrowUp size={11} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{
                              width: 24,
                              paddingInline: 0,
                              opacity: i === daftar.length - 1 ? 0.3 : 1,
                            }}
                            disabled={i === daftar.length - 1 || sibuk}
                            onClick={() => jalankan(f.id, () => movePayslipField(f.id, 'DOWN'))}
                            aria-label={`Turunkan ${f.label}`}
                          >
                            <ArrowDown size={11} />
                          </button>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="t-micro mt-4 border-t pt-3" style={{ borderColor: 'var(--hairline)' }}>
        Perubahan langsung berlaku pada slip gaji yang dibuka atau dicetak berikutnya, termasuk slip
        periode lampau.
      </p>

      <Toast state={result} onDismiss={() => setResult(null)} />
    </>
  );
}
