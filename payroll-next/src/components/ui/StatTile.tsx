import type { ReactNode } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { GlassCard } from './Glass';

/**
 * Kartu angka utama.
 *
 * Susunannya sengaja bertingkat ke bawah, bukan berdampingan: keterangan
 * seperti "termasuk BPJS pemberi kerja" terlalu panjang untuk diapit
 * sparkline, dan sebelumnya pecah menjadi empat baris sempit.
 *
 *   LABEL                    [ikon]
 *   Rp 491 jt                        ← angka sebagai pahlawan
 *   ↗ +0,5%            ▁▂▃▅          ← perubahan & tren sejajar
 *   termasuk BPJS pemberi kerja       ← keterangan selebar kartu
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
  const adaDelta = delta !== undefined && delta !== null;

  return (
    <GlassCard hover className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <span className="label !mb-0 truncate">{label}</span>
        {icon && (
          <span
            className="grid size-7 shrink-0 place-items-center rounded-lg"
            style={{ background: 'var(--field-bg)', color: 'var(--text-muted)' }}
          >
            {icon}
          </span>
        )}
      </div>

      <p className="t-money-lg" style={{ fontSize: '1.5rem', lineHeight: '1.875rem' }}>
        {value}
      </p>

      {(adaDelta || chart) && (
        <div className="flex min-h-[26px] items-center justify-between gap-2">
          {adaDelta ? (
            <span
              className="tnum inline-flex items-center gap-0.5 t-label font-semibold"
              style={{ color: bagus ? 'var(--color-jade-500)' : 'var(--color-clay-500)' }}
            >
              {naik ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {naik ? '+' : ''}
              {delta.toFixed(1)}%
            </span>
          ) : (
            <span />
          )}
          {chart}
        </div>
      )}

      {sub && (
        <p className="t-micro leading-snug" style={{ marginTop: adaDelta || chart ? 0 : '0.25rem' }}>
          {sub}
        </p>
      )}
    </GlassCard>
  );
}
