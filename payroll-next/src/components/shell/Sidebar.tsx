'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  CalendarCheck, ChartColumn, CircleUser, FlaskConical, LayoutDashboard, Layers, LogOut,
  Menu, Network, Palmtree, Receipt, ScrollText, Settings, Timer, Users, Wallet, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { groupedNavFor } from '@/lib/nav';
import type { Role } from '@/lib/auth';
import { Avatar, statusLabel } from '@/components/ui/Glass';
import { logoutAction } from '@/actions/auth';

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, Users, Network, CalendarCheck, Palmtree, Timer,
  Layers, Wallet, Receipt, ChartColumn, CircleUser, Settings, ScrollText, FlaskConical,
};

export default function Sidebar({
  role,
  name,
  email,
}: {
  role: Role;
  name: string;
  email: string;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const groups = groupedNavFor(role);

  // min-h-0 wajib pada nav: tanpa itu item flex tidak boleh mengecil di bawah
  // tinggi isinya, sehingga daftar menu memanjangkan panel melewati bawah
  // layar dan kartu pengguna di bagian bawah ikut terpotong.
  const nav = (
    <nav className="scroll-slim min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {groups.map((g) => (
        <div key={g.name}>
          <p className="label !mb-1.5 px-2.5">{g.name}</p>
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const Icon = ICONS[item.icon] ?? LayoutDashboard;
              // /payroll juga aktif saat berada di /payroll/<id>
              const active = path === item.href || path.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="relative flex items-center gap-2.5 rounded-[10px] px-2.5 py-[7px] t-small transition-colors"
                    style={{
                      background: active ? 'var(--accent-soft)' : 'transparent',
                      color: active ? 'var(--accent)' : 'var(--text-body)',
                      fontWeight: active ? 600 : 450,
                    }}
                  >
                    {active && (
                      <span
                        className="absolute top-1/2 -left-3 h-4 w-[3px] -translate-y-1/2 rounded-r-full"
                        style={{ background: 'var(--accent)' }}
                      />
                    )}
                    <Icon size={15.5} strokeWidth={active ? 2.1 : 1.8} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const panel = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span
          className="grid size-8 shrink-0 place-items-center rounded-[10px]"
          style={{
            background: 'linear-gradient(145deg, var(--color-jade-500), var(--color-jade-700))',
            boxShadow: 'inset 0 1px 0 rgb(255 255 255 / .28)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M4 15V5.5a1 1 0 0 1 1.6-.8l8.8 6.6a1 1 0 0 1 0 1.6L10 16"
              stroke="#eaf5f0"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block t-body font-semibold" style={{ color: 'var(--text-strong)' }}>
            Racik
          </span>
          <span className="block t-micro" style={{ color: 'var(--text-muted)' }}>
            PT Nusantara Digital
          </span>
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-ghost btn-sm ml-auto lg:hidden"
          aria-label="Tutup menu"
        >
          <X size={15} />
        </button>
      </div>

      {nav}

      <div className="border-t p-3" style={{ borderColor: 'var(--hairline)' }}>
        <Link
          href="/me"
          onClick={() => setOpen(false)}
          className="mb-2 flex items-center gap-2.5 rounded-[10px] px-2 py-2 transition-colors hover:bg-[var(--field-bg)]"
        >
          <Avatar name={name} size={32} />
          <span className="min-w-0 flex-1">
            <span
              className="block truncate t-small font-medium"
              style={{ color: 'var(--text-strong)' }}
            >
              {name}
            </span>
            {/* Surel tidak muat di lebar 236px dan hanya menghasilkan teks
                terpotong yang tidak berguna — dipindah ke tooltip. */}
            <span
              className="block truncate t-micro"
              style={{ color: 'var(--text-muted)' }}
              title={email}
            >
              {statusLabel(role)}
            </span>
          </span>
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="btn btn-ghost btn-sm w-full">
            <LogOut size={14} />
            Keluar
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* pemicu di layar sempit */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-ghost btn-sm lg:hidden"
        aria-label="Buka menu"
      >
        <Menu size={16} />
      </button>

      {/* rel tetap di layar lebar */}
      <aside
        className="glass fixed top-3 bottom-3 left-3 z-30 hidden w-[236px] overflow-hidden lg:flex"
        style={{ borderRadius: 20 }}
      >
        {panel}
      </aside>

      {/* laci di layar sempit */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0"
            style={{ background: 'rgb(0 0 0 / .45)', backdropFilter: 'blur(3px)' }}
            onClick={() => setOpen(false)}
          />
          <aside
            className="glass rise absolute top-3 bottom-3 left-3 flex w-[248px] overflow-hidden"
            style={{ borderRadius: 20, animationDuration: '.3s' }}
          >
            {panel}
          </aside>
        </div>
      )}
    </>
  );
}
