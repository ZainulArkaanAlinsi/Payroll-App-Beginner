'use client';

import { useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { labelPeriode, periodeSebelum } from '@/lib/format';

/** Navigasi periode "YYYY-MM" lewat URL. */
export default function PeriodPicker({
  period,
  max,
}: {
  period: string;
  /** periode terjauh yang boleh dipilih ke depan */
  max?: string;
}) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const go = (p: string) => {
    const next = new URLSearchParams(params.toString());
    next.set('period', p);
    start(() => router.replace(`${path}?${next.toString()}`, { scroll: false }));
  };

  const sebelum = periodeSebelum(period, 1);
  const sesudah = periodeSebelum(period, -1);
  const majuTerkunci = max ? sesudah > max : false;

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => go(sebelum)}
        className="btn btn-ghost btn-sm"
        style={{ width: 30, paddingInline: 0 }}
        aria-label="Periode sebelumnya"
      >
        <ChevronLeft size={15} />
      </button>

      <span
        className="glass-thin min-w-[9.5rem] px-3 py-1.5 text-center t-small font-medium"
        style={{ color: 'var(--text-strong)' }}
      >
        {pending ? (
          <LoaderCircle size={14} className="mx-auto animate-spin" />
        ) : (
          labelPeriode(period)
        )}
      </span>

      <button
        type="button"
        onClick={() => go(sesudah)}
        disabled={majuTerkunci}
        className="btn btn-ghost btn-sm"
        style={{ width: 30, paddingInline: 0, opacity: majuTerkunci ? 0.4 : 1 }}
        aria-label="Periode berikutnya"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}
