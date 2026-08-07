'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { togglePayslipField } from '@/actions/racik';
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

export default function PayslipFields({
  fields,
}: {
  fields: { id: string; key: string; label: string; section: string; visible: boolean }[];
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();
  const [result, setResult] = useState<ActionState | null>(null);
  const router = useRouter();

  const flip = (id: string, next: boolean) => {
    setPendingId(id);
    start(async () => {
      const s = await togglePayslipField(id, next);
      setResult(s);
      setPendingId(null);
      router.refresh();
    });
  };

  const sections = [...new Set(fields.map((f) => f.section))];

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((sec) => (
          <div key={sec}>
            <p className="label">{SECTION_LABEL[sec] ?? sec}</p>
            <ul className="space-y-1.5">
              {fields
                .filter((f) => f.section === sec)
                .map((f) => {
                  const dikunci = WAJIB.has(f.key);
                  return (
                    <li key={f.id}>
                      <label
                        className="glass-thin flex items-center gap-3 px-3 py-2.5 transition-colors"
                        style={{
                          cursor: dikunci ? 'not-allowed' : 'pointer',
                          opacity: dikunci ? 0.7 : 1,
                          borderColor: f.visible
                            ? 'color-mix(in srgb, var(--accent) 30%, transparent)'
                            : undefined,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={f.visible}
                          disabled={dikunci || pendingId === f.id}
                          onChange={() => flip(f.id, !f.visible)}
                          className="size-4 shrink-0 rounded"
                          style={{ accentColor: 'var(--color-jade-600)' }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate t-small" style={{ color: 'var(--text-strong)' }}>
                            {f.label}
                          </span>
                          {dikunci && <span className="t-micro block">selalu tampil</span>}
                        </span>
                        {pendingId === f.id ? (
                          <LoaderCircle size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                        ) : f.visible ? (
                          <Eye size={14} style={{ color: 'var(--accent)' }} />
                        ) : (
                          <EyeOff size={14} style={{ color: 'var(--text-muted)' }} />
                        )}
                      </label>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>

      <Toast state={result} onDismiss={() => setResult(null)} />
    </>
  );
}
