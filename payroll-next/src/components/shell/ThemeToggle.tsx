'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle({ compact }: { compact?: boolean }) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
    setReady(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('racik-theme', next ? 'dark' : 'light');
    } catch {
      /* mode privat menolak localStorage — abaikan */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      title={dark ? 'Mode terang' : 'Mode gelap'}
      className="btn btn-ghost btn-sm"
      style={{ width: compact ? 34 : undefined, paddingInline: compact ? 0 : undefined }}
    >
      {/* sebelum efek berjalan, ikon dibuat netral agar tidak salah tampil */}
      {ready ? dark ? <Sun size={15} /> : <Moon size={15} /> : <Moon size={15} style={{ opacity: 0 }} />}
      {!compact && <span>{ready && dark ? 'Terang' : 'Gelap'}</span>}
    </button>
  );
}
