'use client';

import { useState, type ReactNode } from 'react';

export interface TabDef {
  key: string;
  label: string;
  /** angka kecil di samping label, mis. jumlah baris di dalamnya */
  count?: number;
  hint?: string;
}

/**
 * Tab isi halaman.
 *
 * Dipakai pada halaman yang isinya banyak tetapi tidak selalu dibutuhkan
 * bersamaan — memaksa HR menggulir melewati enam kartu untuk mencari satu
 * angka adalah cara tercepat membuat aplikasi terasa melelahkan.
 *
 * Panel dikirim sebagai ReactNode yang sudah dirender di server, jadi
 * berpindah tab tidak memicu permintaan baru.
 */
export default function Tabs({
  tabs,
  panels,
  initial,
}: {
  tabs: TabDef[];
  panels: Record<string, ReactNode>;
  initial?: string;
}) {
  const [aktif, setAktif] = useState(initial ?? tabs[0]?.key);
  const info = tabs.find((t) => t.key === aktif);

  return (
    <>
      <div
        className="glass scroll-slim flex gap-1 overflow-x-auto p-1.5"
        style={{ borderRadius: 14 }}
        role="tablist"
      >
        {tabs.map((t) => {
          const on = t.key === aktif;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setAktif(t.key)}
              className="flex shrink-0 items-center gap-2 rounded-[10px] px-3.5 py-2 transition-colors"
              style={{
                background: on ? 'var(--accent-soft)' : 'transparent',
                color: on ? 'var(--accent)' : 'var(--text-body)',
                fontWeight: on ? 600 : 500,
                fontSize: '0.8125rem',
              }}
            >
              {t.label}
              {t.count !== undefined && (
                <span
                  className="tnum rounded-full px-1.5 py-px"
                  style={{
                    background: on ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'var(--field-bg)',
                    color: on ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '0.625rem',
                    fontWeight: 600,
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {info?.hint && <p className="t-small -mt-1 px-1">{info.hint}</p>}

      <div role="tabpanel">{panels[aktif]}</div>
    </>
  );
}
