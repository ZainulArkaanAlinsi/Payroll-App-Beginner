'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LoaderCircle, Search, X } from 'lucide-react';

export interface FilterDef {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}

/**
 * Pencarian & penyaring yang menulis ke URL, bukan ke state lokal.
 * Konsekuensinya halaman tetap Server Component, hasil filter bisa
 * dibagikan lewat tautan, dan tombol kembali peramban tetap masuk akal.
 */
export default function TableToolbar({
  searchPlaceholder = 'Cari…',
  filters = [],
  right,
}: {
  searchPlaceholder?: string;
  filters?: FilterDef[];
  right?: React.ReactNode;
}) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get('q') ?? '');

  const push = (next: URLSearchParams) => {
    start(() => router.replace(`${path}?${next.toString()}`, { scroll: false }));
  };

  // tunda navigasi supaya tiap ketukan tidak memicu kueri
  useEffect(() => {
    const now = params.get('q') ?? '';
    if (q === now) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (q) next.set('q', q);
      else next.delete('q');
      next.delete('page');
      push(next);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const setFilter = (name: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    next.delete('page');
    push(next);
  };

  const aktif = filters.some((f) => params.get(f.name)) || Boolean(params.get('q'));

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search
          size={14}
          className="absolute top-1/2 left-3 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          className="field pl-9"
          aria-label={searchPlaceholder}
        />
        {pending && (
          <LoaderCircle
            size={14}
            className="absolute top-1/2 right-3 -translate-y-1/2 animate-spin"
            style={{ color: 'var(--text-muted)' }}
          />
        )}
      </div>

      {filters.map((f) => (
        <select
          key={f.name}
          value={params.get(f.name) ?? ''}
          onChange={(e) => setFilter(f.name, e.target.value)}
          className="field w-auto min-w-[9rem]"
          aria-label={f.label}
        >
          <option value="">{f.label}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}

      {aktif && (
        <button
          type="button"
          onClick={() => {
            setQ('');
            start(() => router.replace(path, { scroll: false }));
          }}
          className="btn btn-ghost btn-sm"
        >
          <X size={13} />
          Bersihkan
        </button>
      )}

      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}
