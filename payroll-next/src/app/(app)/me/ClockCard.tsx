'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, LogIn, LogOut } from 'lucide-react';
import { clockAction } from '@/actions/requests';
import { Chip, GlassCard } from '@/components/ui/Glass';
import { Toast } from '@/components/ui/Feedback';
import type { ActionState } from '@/lib/types';

export default function ClockCard({
  clockIn,
  clockOut,
  status,
  lateMinutes,
  workStart,
}: {
  clockIn: string | null;
  clockOut: string | null;
  status: string | null;
  lateMinutes: number;
  workStart: string;
}) {
  const [now, setNow] = useState<Date | null>(null);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionState | null>(null);
  const router = useRouter();

  // Jam baru dipasang setelah hidrasi — kalau dirender di server,
  // waktunya berbeda dengan klien dan React protes.
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const jalankan = (kind: 'IN' | 'OUT') => {
    start(async () => {
      const s = await clockAction(kind);
      setResult(s);
      router.refresh();
    });
  };

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—';

  const durasi =
    clockIn && !clockOut && now
      ? Math.floor((now.getTime() - new Date(clockIn).getTime()) / 60000)
      : clockIn && clockOut
        ? Math.floor((new Date(clockOut).getTime() - new Date(clockIn).getTime()) / 60000)
        : 0;

  return (
    <>
      <GlassCard className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="label !mb-1">Waktu sekarang</p>
          <p
            className="tnum text-3xl leading-none font-semibold"
            style={{ color: 'var(--text-strong)', letterSpacing: '-0.02em' }}
          >
            {now
              ? now.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : '--:--:--'}
          </p>
          <p className="mt-1.5 text-[0.75rem]" style={{ color: 'var(--text-muted)' }}>
            {now
              ? now.toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : ''}
            {' · jam masuk '}
            {workStart}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="text-center">
            <p className="label !mb-1">Masuk</p>
            <p className="tnum text-lg font-semibold" style={{ color: 'var(--text-strong)' }}>
              {fmt(clockIn)}
            </p>
            {lateMinutes > 0 && (
              <span className="mt-1 inline-block">
                <Chip tone="brass">telat {lateMinutes}m</Chip>
              </span>
            )}
          </div>

          <div className="text-center">
            <p className="label !mb-1">Pulang</p>
            <p className="tnum text-lg font-semibold" style={{ color: 'var(--text-strong)' }}>
              {fmt(clockOut)}
            </p>
            {durasi > 0 && (
              <span className="mt-1 block text-[0.625rem]" style={{ color: 'var(--text-muted)' }}>
                {Math.floor(durasi / 60)}j {durasi % 60}m
              </span>
            )}
          </div>

          {!clockIn ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={pending}
              onClick={() => jalankan('IN')}
            >
              {pending ? <LoaderCircle size={15} className="animate-spin" /> : <LogIn size={15} />}
              Absen masuk
            </button>
          ) : !clockOut ? (
            <button
              type="button"
              className="btn btn-ghost"
              disabled={pending}
              onClick={() => jalankan('OUT')}
            >
              {pending ? <LoaderCircle size={15} className="animate-spin" /> : <LogOut size={15} />}
              Absen pulang
            </button>
          ) : (
            <Chip tone="jade" dot>
              Kehadiran hari ini lengkap
            </Chip>
          )}
        </div>
      </GlassCard>

      <Toast state={result} onDismiss={() => setResult(null)} />
    </>
  );
}
