import type { ReactNode } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { GlassCard } from './Glass';

/**
 * Kartu angka utama. Angka besar adalah pahlawannya — label dan delta
 * mengambil peran pendukung, tidak bersaing dengan nilainya.
 */
export default function StatTile({
  label,
  value,
  sub,
  delta,
  icon,
  chart,
  invertDelta,
}: {
  label: string;
  value: string;
  sub?: string;
  /** perubahan dalam persen; positif = naik */
  delta?: number | null;
  icon?: ReactNode;
  chart?: ReactNode;
  /** untuk metrik yang naiknya buruk (mis. potongan), warna dibalik */
  invertDelta?: boolean;
}) {
  const naik = (delta ?? 0) >= 0;
  const bagus = invertDelta ? !naik : naik;

  return (
    <GlassCard hover className="flex flex-col justify-between gap-3">
      <div className="flex items-start justify-between gap-3">
        <span className="label !mb-0">{label}</span>
        {icon && (
          <span
            className="grid size-7 shrink-0 place-items-center rounded-lg"
            style={{ background: 'var(--field-bg)', color: 'var(--text-muted)' }}
          >
            {icon}
          </span>
        )}
      </div>

      <div>
        <p
          className="tnum t-money-lg leading-none font-semibold"
          style={{ color: 'var(--text-strong)', letterSpacing: '-0.02em' }}
        >
          {value}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            {delta !== undefined && delta !== null && (
              <span
                className="tnum inline-flex items-center gap-0.5 t-micro font-semibold"
                style={{ color: bagus ? 'var(--color-jade-500)' : 'var(--color-clay-500)' }}
              >
                {naik ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {naik ? '+' : ''}
                {delta.toFixed(1)}%
              </span>
            )}
            {sub && (
              <span className="t-micro" style={{ color: 'var(--text-muted)' }}>
                {sub}
              </span>
            )}
          </span>
          {chart}
        </div>
      </div>
    </GlassCard>
  );
}
