'use client';

import { useEffect, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { CircleAlert, CircleCheck, LoaderCircle, X } from 'lucide-react';
import type { ActionState } from '@/lib/types';

/** Pesan hasil aksi yang menghilang sendiri. */
export function Toast({
  state,
  onDismiss,
}: {
  state: ActionState | null;
  onDismiss?: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!state?.message && !state?.error) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 4200);
    return () => clearTimeout(t);
  }, [state, onDismiss]);

  if (!visible || (!state?.message && !state?.error)) return null;
  const bad = Boolean(state.error);

  return (
    <div
      role="status"
      aria-live="polite"
      className="glass rise fixed right-4 bottom-4 z-[90] flex max-w-sm items-start gap-2.5 px-4 py-3"
      style={{
        animationDuration: '.3s',
        borderColor: bad
          ? 'color-mix(in srgb, var(--color-clay-500) 40%, transparent)'
          : 'color-mix(in srgb, var(--color-jade-500) 40%, transparent)',
      }}
    >
      {bad ? (
        <CircleAlert size={16} className="mt-px shrink-0" style={{ color: 'var(--color-clay-500)' }} />
      ) : (
        <CircleCheck size={16} className="mt-px shrink-0" style={{ color: 'var(--color-jade-500)' }} />
      )}
      <p className="text-[0.8125rem] leading-snug" style={{ color: 'var(--text-strong)' }}>
        {state.error ?? state.message}
      </p>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          onDismiss?.();
        }}
        aria-label="Tutup pesan"
        className="shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

/** Tombol submit yang menampilkan status kirim. */
export function SubmitButton({
  children,
  className = 'btn btn-primary',
  pendingLabel = 'Menyimpan…',
}: {
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? (
        <>
          <LoaderCircle size={14} className="animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Tombol untuk server action yang tidak berbentuk formulir.
 * Menyediakan konfirmasi opsional, status memuat, dan pesan hasil.
 */
export function ActionButton({
  action,
  children,
  className = 'btn btn-ghost btn-sm',
  confirm,
  pendingLabel,
  onDone,
}: {
  action: () => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  confirm?: string;
  pendingLabel?: string;
  onDone?: (s: ActionState) => void;
}) {
  const [pending, start] = useTransition();
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState<ActionState | null>(null);
  const router = useRouter();

  const run = () => {
    setAsking(false);
    start(async () => {
      const s = await action();
      setResult(s);
      onDone?.(s);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() => (confirm ? setAsking(true) : run())}
      >
        {pending ? (
          <>
            <LoaderCircle size={13} className="animate-spin" />
            {pendingLabel ?? 'Memproses…'}
          </>
        ) : (
          children
        )}
      </button>

      {asking && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ background: 'rgb(0 0 0 / .45)', backdropFilter: 'blur(4px)' }}
            onClick={() => setAsking(false)}
          />
          <div className="glass rise relative w-full max-w-sm" style={{ animationDuration: '.24s' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-strong)' }}>
              Konfirmasi
            </p>
            <p className="mt-1.5 text-[0.8125rem]">{confirm}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAsking(false)}>
                Batal
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={run}>
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast state={result} onDismiss={() => setResult(null)} />
    </>
  );
}
