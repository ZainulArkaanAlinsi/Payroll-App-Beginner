'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  // Esc menutup, dan halaman di belakang tidak ikut menggulir.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 py-[6vh]">
      <div
        className="fixed inset-0"
        style={{ background: 'rgb(0 0 0 / .45)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="glass rise relative w-full !p-0"
        style={{ maxWidth: wide ? '52rem' : '32rem', animationDuration: '.26s' }}
      >
        <div
          className="flex items-start justify-between gap-4 border-b px-5 py-4"
          style={{ borderColor: 'var(--hairline)' }}
        >
          <div>
            <h2 className="text-[0.9375rem] font-semibold">{title}</h2>
            {description && (
              <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="btn btn-ghost btn-sm shrink-0"
            style={{ width: 30, paddingInline: 0 }}
          >
            <X size={15} />
          </button>
        </div>

        <div className="scroll-slim max-h-[64vh] overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div
            className="flex items-center justify-end gap-2 border-t px-5 py-3"
            style={{ borderColor: 'var(--hairline)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
