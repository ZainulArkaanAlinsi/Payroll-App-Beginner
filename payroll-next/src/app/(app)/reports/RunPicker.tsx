'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Download, LoaderCircle } from 'lucide-react';

/**
 * Pemilih periode laporan.
 *
 * Sebelumnya berupa formulir dengan tombol "Terapkan" — dua langkah untuk
 * satu maksud. Sekarang berpindah begitu pilihan berubah, dan tautan ekspor
 * ikut menyesuaikan periode yang sedang dilihat.
 */
export default function RunPicker({
  runs,
  selectedId,
}: {
  runs: { id: string; label: string }[];
  selectedId: string;
}) {
  const router = useRouter();
  const path = usePathname();
  const [pending, start] = useTransition();

  return (
    <div className="page-head-actions">
      <label className="relative">
        <span className="sr-only">Pilih periode laporan</span>
        <select
          value={selectedId}
          onChange={(e) => start(() => router.replace(`${path}?run=${e.target.value}`, { scroll: false }))}
          className="field w-auto min-w-[11rem]"
          disabled={pending}
        >
          {runs.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        {pending && (
          <LoaderCircle
            size={13}
            className="absolute top-1/2 right-8 -translate-y-1/2 animate-spin"
            style={{ color: 'var(--text-muted)' }}
          />
        )}
      </label>

      <a href={`/api/export/payroll/${selectedId}`} className="btn btn-ghost btn-sm">
        <Download size={13} />
        Rincian payroll
      </a>
      <a href={`/api/export/tax/${selectedId}`} className="btn btn-ghost btn-sm">
        <Download size={13} />
        Rekap PPh 21
      </a>
    </div>
  );
}
