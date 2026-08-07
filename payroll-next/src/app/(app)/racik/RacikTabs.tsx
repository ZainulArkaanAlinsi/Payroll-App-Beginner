'use client';

import { useState, type ReactNode } from 'react';
import { FileSpreadsheet, GitBranch, Receipt, SlidersHorizontal } from 'lucide-react';

const TAB = [
  {
    key: 'aturan',
    label: 'Aturan divisi',
    icon: SlidersHorizontal,
    hint: 'Toleransi telat, denda, dan tarif lembur boleh berbeda antar departemen atau tingkat jabatan. Aturan paling spesifik yang menang.',
  },
  {
    key: 'alur',
    label: 'Alur persetujuan',
    icon: GitBranch,
    hint: 'Susun sendiri siapa menyetujui dan dalam urutan apa. Tahap berikutnya terkunci sampai tahap sebelumnya selesai.',
  },
  {
    key: 'slip',
    label: 'Susunan slip',
    icon: Receipt,
    hint: 'Pilih baris apa saja yang tampil di slip karyawan dan atur urutannya. Berlaku juga pada slip periode lampau.',
  },
  {
    key: 'bank',
    label: 'Format bank',
    icon: FileSpreadsheet,
    hint: 'Petakan sendiri kolom berkas transfer agar cocok dengan format bank mana pun, tanpa menunggu pembaruan sistem.',
  },
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

      <div className="glass-thin flex items-start gap-2.5 px-4 py-2.5">
        <info.icon size={15} className="mt-px shrink-0" style={{ color: 'var(--accent)' }} />
        <p className="t-small">{info.hint}</p>
      </div>

      {panels[aktif]}
    </>
  );
}
