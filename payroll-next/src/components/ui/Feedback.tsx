'use client';

import { useEffect, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { CircleAlert, CircleCheck, LoaderCircle, X } from 'lucide-react';
import type { ActionState } from '@/lib/types';
import ConfirmDialog from './ConfirmDialog';

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
      <p className="t-small leading-snug" style={{ color: 'var(--text-strong)' }}>
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
  confirmTitle,
  confirmLabel,
  pendingLabel,
  onDone,
}: {
  action: () => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  confirm?: string;
  /** judul dialog; bila kosong disusun dari nada aksinya */
  confirmTitle?: string;
  /** label tombol utama di dialog, mis. "Hapus permanen" */
  confirmLabel?: string;
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

      {/* Nada dialog dibaca dari gaya tombolnya: tombol merah berarti
          aksinya merusak, jadi dialognya ikut memperingatkan. */}
      <ConfirmDialog
        open={asking}
        message={confirm ?? ''}
        title={confirmTitle}
        confirmLabel={confirmLabel}
        tone={className.includes('btn-danger') ? 'danger' : 'normal'}
        pending={pending}
        onConfirm={run}
        onCancel={() => setAsking(false)}
      />

      <Toast state={result} onDismiss={() => setResult(null)} />
    </>
  );
}
