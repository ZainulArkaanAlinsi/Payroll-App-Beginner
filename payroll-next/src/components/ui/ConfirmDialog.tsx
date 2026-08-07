'use client';

import { useEffect, useRef } from 'react';
import { CircleHelp, LoaderCircle, TriangleAlert } from 'lucide-react';

/**
 * Dialog konfirmasi.
 *
 * Yang dibenahi dari versi sebelumnya: judulnya cuma "Konfirmasi" — tidak
 * memberi tahu apa pun — dan tombolnya selalu hijau meski aksinya menghapus
 * data. Sekarang nada dialog mengikuti akibat aksinya, judulnya menyebut
 * tindakan yang akan terjadi, dan tombol utama diberi warna sesuai risiko.
 *
 * Papan tik ikut ditangani: Esc membatalkan, Enter meneruskan, dan fokus
 * langsung jatuh ke tombol batal — jadi menekan Enter tanpa membaca tidak
 * pernah menghapus apa pun secara tidak sengaja pada aksi berisiko.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Lanjutkan',
  cancelLabel = 'Batal',
  tone = 'normal',
  pending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'normal' | 'danger';
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const batalRef = useRef<HTMLButtonElement>(null);
  const lanjutRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    // Aksi berisiko memberi fokus awal ke tombol batal; aksi biasa
    // langsung ke tombol utama supaya alurnya cepat.
    const t = requestAnimationFrame(() => {
      (tone === 'danger' ? batalRef : lanjutRef).current?.focus();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      cancelAnimationFrame(t);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, tone, onCancel]);

  if (!open) return null;

  const bahaya = tone === 'danger';
  const Ikon = bahaya ? TriangleAlert : CircleHelp;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: 'rgb(8 12 14 / .55)', backdropFilter: 'blur(6px)' }}
        onClick={pending ? undefined : onCancel}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title ?? 'Konfirmasi'}
        className="glass rise relative w-full max-w-[27rem] overflow-hidden !p-0"
        style={{ animationDuration: '.22s' }}
      >
        <div className="flex gap-3.5 px-5 pt-5 pb-4">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-full"
            style={{
              background: bahaya ? 'rgb(168 90 79 / .15)' : 'var(--accent-soft)',
              color: bahaya ? 'var(--color-clay-500)' : 'var(--accent)',
            }}
          >
            <Ikon size={19} />
          </span>

          <div className="min-w-0 pt-0.5">
            <h2 className="t-heading">{title ?? (bahaya ? 'Tindakan ini sulit dibatalkan' : 'Konfirmasi tindakan')}</h2>
            <p className="mt-1.5 t-small">{message}</p>
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-2 border-t px-5 py-3"
          style={{ borderColor: 'var(--hairline)', background: 'var(--field-bg)' }}
        >
          <button
            ref={batalRef}
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onCancel}
            disabled={pending}
          >
            {cancelLabel}
          </button>
          <button
            ref={lanjutRef}
            type="button"
            className={bahaya ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm'}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? (
              <>
                <LoaderCircle size={13} className="animate-spin" />
                Memproses…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
