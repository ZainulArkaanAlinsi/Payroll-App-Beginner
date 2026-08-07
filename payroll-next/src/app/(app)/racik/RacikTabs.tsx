'use client';

import { useState, type ReactNode } from 'react';
import { FileSpreadsheet, GitBranch, Receipt, SlidersHorizontal } from 'lucide-react';

const TAB = [
  { key: 'aturan', label: 'Aturan divisi', icon: SlidersHorizontal, hint: 'Denda telat & tarif lembur per departemen' },
  { key: 'alur', label: 'Alur persetujuan', icon: GitBranch, hint: 'Siapa menyetujui, dalam urutan apa' },
  { key: 'slip', label: 'Susunan slip', icon: Receipt, hint: 'Baris apa saja yang tampil di slip gaji' },
  { key: 'bank', label: 'Format bank', icon: FileSpreadsheet, hint: 'Susunan kolom berkas transfer' },
] as const;

export type TabKey = (typeof TAB)[number]['key'];

export default function RacikTabs({
  panels,
}: {
  panels: Record<TabKey, ReactNode>;
}) {
  const [aktif, setAktif] = useState<TabKey>('aturan');
  const info = TAB.find((t) => t.key === aktif)!;

  return (
    <>
      <div className="glass flex flex-wrap gap-1 p-1.5" style={{ borderRadius: 14 }}>
        {TAB.map((t) => {
          const on = t.key === aktif;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setAktif(t.key)}
              className="flex flex-1 items-center justify-center gap-2 rounded-[10px] px-3 py-2 transition-colors"
              style={{
                background: on ? 'var(--accent-soft)' : 'transparent',
                color: on ? 'var(--accent)' : 'var(--text-body)',
                fontWeight: on ? 600 : 500,
                fontSize: '0.8125rem',
                minWidth: 140,
              }}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      <p className="t-small -mt-1 px-1">{info.hint}</p>

      {panels[aktif]}
    </>
  );
}
