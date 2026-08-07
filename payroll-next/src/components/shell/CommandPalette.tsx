'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CornerDownLeft, Search, User } from 'lucide-react';
import { navFor, type NavItem } from '@/lib/nav';
import type { Role } from '@/lib/auth';
import { Avatar } from '@/components/ui/Glass';

interface EmployeeHit {
  id: string;
  fullName: string;
  employeeNo: string;
  position: string | null;
  department: string | null;
}

export default function CommandPalette({ role }: { role: Role }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const [people, setPeople] = useState<EmployeeHit[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const pages: NavItem[] = navFor(role).filter(
    (n) =>
      !q ||
      n.label.toLowerCase().includes(q.toLowerCase()) ||
      (n.hint ?? '').toLowerCase().includes(q.toLowerCase()),
  );

  // ⌘K / Ctrl+K membuka, Esc menutup
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ('');
      setCursor(0);
      setPeople([]);
      // fokus setelah dialog benar-benar terpasang
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // cari karyawan setelah pengetikan berhenti sejenak
  useEffect(() => {
    if (!open || q.trim().length < 2 || !['ADMIN', 'HR'].includes(role)) {
      setPeople([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (res.ok) setPeople(await res.json());
      } catch {
        /* dibatalkan atau jaringan gagal — biarkan daftar kosong */
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, open, role]);

  const results = [
    ...pages.map((p) => ({ kind: 'page' as const, item: p })),
    ...people.map((p) => ({ kind: 'person' as const, item: p })),
  ];

  const go = useCallback(
    (i: number) => {
      const r = results[i];
      if (!r) return;
      setOpen(false);
      router.push(r.kind === 'page' ? r.item.href : `/employees/${r.item.id}`);
    },
    [results, router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(cursor);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass-thin flex items-center gap-2 px-2.5 py-1.5 text-xs transition-colors sm:min-w-[220px]"
        style={{ color: 'var(--text-muted)' }}
      >
        <Search size={14} />
        <span className="hidden sm:inline">Cari halaman atau karyawan…</span>
        <kbd
          className="ml-auto hidden rounded border px-1.5 py-px font-mono text-[0.625rem] sm:inline"
          style={{ borderColor: 'var(--hairline)' }}
        >
          ⌘K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
          <div
            className="absolute inset-0"
            style={{ background: 'rgb(0 0 0 / .4)', backdropFilter: 'blur(4px)' }}
            onClick={() => setOpen(false)}
          />

          <div
            className="glass rise relative w-full max-w-lg overflow-hidden !p-0"
            style={{ animationDuration: '.24s' }}
            role="dialog"
            aria-modal="true"
            aria-label="Palet perintah"
          >
            <div
              className="flex items-center gap-2.5 border-b px-4 py-3"
              style={{ borderColor: 'var(--hairline)' }}
            >
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setCursor(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Ketik untuk mencari…"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--text-strong)' }}
              />
              <kbd
                className="rounded border px-1.5 py-px font-mono text-[0.625rem]"
                style={{ borderColor: 'var(--hairline)', color: 'var(--text-muted)' }}
              >
                esc
              </kbd>
            </div>

            <ul className="scroll-slim max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-3 py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                  Tidak ada yang cocok dengan “{q}”.
                </li>
              )}

              {results.map((r, i) => (
                <li key={r.kind === 'page' ? r.item.href : r.item.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(i)}
                    className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left transition-colors"
                    style={{ background: cursor === i ? 'var(--accent-soft)' : 'transparent' }}
                  >
                    {r.kind === 'page' ? (
                      <>
                        <span
                          className="grid size-7 shrink-0 place-items-center rounded-lg"
                          style={{ background: 'var(--field-bg)', color: 'var(--text-muted)' }}
                        >
                          <Search size={13} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className="block text-[0.8125rem] font-medium"
                            style={{ color: 'var(--text-strong)' }}
                          >
                            {r.item.label}
                          </span>
                          <span
                            className="block truncate text-[0.6875rem]"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {r.item.hint}
                          </span>
                        </span>
                      </>
                    ) : (
                      <>
                        <Avatar name={r.item.fullName} size={28} />
                        <span className="min-w-0 flex-1">
                          <span
                            className="block truncate text-[0.8125rem] font-medium"
                            style={{ color: 'var(--text-strong)' }}
                          >
                            {r.item.fullName}
                          </span>
                          <span
                            className="block truncate text-[0.6875rem]"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {r.item.employeeNo} · {r.item.position ?? '—'}
                          </span>
                        </span>
                        <User size={13} style={{ color: 'var(--text-muted)' }} />
                      </>
                    )}
                    {cursor === i && (
                      <CornerDownLeft size={13} style={{ color: 'var(--accent)' }} />
                    )}
                  </button>
                </li>
              ))}
            </ul>

            <div
              className="flex items-center gap-3 border-t px-4 py-2 text-[0.625rem]"
              style={{ borderColor: 'var(--hairline)', color: 'var(--text-muted)' }}
            >
              <span>↑↓ pilih</span>
              <span>↵ buka</span>
              <span className="ml-auto">{results.length} hasil</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
