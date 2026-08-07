'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, CircleAlert, CircleCheck, Info } from 'lucide-react';
import { sejak } from '@/lib/format';
import { markAllRead } from '@/actions/notifications';

export interface NotifItem {
  id: string;
  title: string;
  body: string;
  kind: string;
  href: string | null;
  readAt: Date | string | null;
  createdAt: Date | string;
}

const ICON = { success: CircleCheck, warning: CircleAlert, info: Info } as const;
const TONE: Record<string, string> = {
  success: 'var(--color-jade-500)',
  warning: 'var(--color-brass-500)',
  info: 'var(--text-muted)',
};

export default function Notifications({ items }: { items: NotifItem[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn btn-ghost btn-sm relative"
        style={{ width: 34, paddingInline: 0 }}
        aria-label={`Notifikasi${unread ? `, ${unread} belum dibaca` : ''}`}
      >
        <Bell size={15} />
        {unread > 0 && (
          <span
            className="tnum absolute -top-1 -right-1 grid min-w-[16px] place-items-center rounded-full px-1 text-[0.5625rem] font-bold"
            style={{ background: 'var(--color-jade-600)', color: '#fff' }}
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="glass rise absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden !p-0"
            style={{ animationDuration: '.2s' }}
          >
            <div
              className="flex items-center justify-between border-b px-4 py-2.5"
              style={{ borderColor: 'var(--hairline)' }}
            >
              <span className="text-[0.8125rem] font-semibold" style={{ color: 'var(--text-strong)' }}>
                Notifikasi
              </span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    await markAllRead();
                    router.refresh();
                  }}
                  className="flex items-center gap-1 text-[0.6875rem]"
                  style={{ color: 'var(--accent)' }}
                >
                  <CheckCheck size={12} />
                  Tandai dibaca
                </button>
              )}
            </div>

            <ul className="scroll-slim max-h-80 overflow-y-auto">
              {items.length === 0 && (
                <li className="px-4 py-10 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                  Belum ada notifikasi.
                </li>
              )}
              {items.map((n) => {
                const Icon = ICON[n.kind as keyof typeof ICON] ?? Info;
                const inner = (
                  <div
                    className="flex gap-3 px-4 py-3 transition-colors hover:bg-[var(--field-bg)]"
                    style={{
                      background: n.readAt ? 'transparent' : 'var(--accent-soft)',
                      borderTop: '1px solid var(--hairline)',
                    }}
                  >
                    <Icon size={15} className="mt-px shrink-0" style={{ color: TONE[n.kind] }} />
                    <div className="min-w-0">
                      <p className="text-[0.8125rem] font-medium" style={{ color: 'var(--text-strong)' }}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-[0.75rem] leading-snug">{n.body}</p>
                      <p className="mt-1 text-[0.625rem]" style={{ color: 'var(--text-muted)' }}>
                        {sejak(n.createdAt)}
                      </p>
                    </div>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.href ? (
                      <Link href={n.href} onClick={() => setOpen(false)}>
                        {inner}
                      </Link>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
