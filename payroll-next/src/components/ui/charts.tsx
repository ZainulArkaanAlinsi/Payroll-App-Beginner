'use client';

/**
 * Grafik SVG buatan sendiri — tanpa pustaka grafik.
 *
 * Aturan yang dipegang:
 *  · warna kategorikal mengikuti entitas (mis. departemen), bukan peringkat
 *  · satu sumbu saja, tidak pernah sumbu ganda
 *  · garis 2px, ujung data membulat, grid direcede
 *  · setiap grafik punya lapisan hover + alternatif tabel
 *  · identitas tidak pernah hanya lewat warna — selalu ada label
 */

import { useId, useMemo, useState } from 'react';
import { angka, rupiah, rupiahRingkas } from '@/lib/format';

/**
 * Fungsi tidak bisa dioper dari Server Component ke Client Component,
 * jadi format dipilih lewat nama dan diterjemahkan di sini.
 */
export type FormatKey = 'rupiah' | 'ringkas' | 'angka' | 'orang' | 'hari' | 'jam' | 'persen';

const FORMATTERS: Record<FormatKey, (n: number) => string> = {
  rupiah,
  ringkas: rupiahRingkas,
  angka,
  orang: (n) => `${angka(n)} orang`,
  hari: (n) => `${angka(n)} hari`,
  jam: (n) => `${angka(n)} jam`,
  persen: (n) => `${n.toFixed(1)}%`,
};

const fmt = (key: FormatKey) => FORMATTERS[key] ?? rupiah;

export const SERIES = [
  'var(--series-1)',
  'var(--series-2)',
  'var(--series-3)',
  'var(--series-4)',
  'var(--series-5)',
  'var(--series-6)',
] as const;

export const seriesColor = (i: number) => SERIES[i % SERIES.length];

const SEQ = ['var(--seq-1)', 'var(--seq-2)', 'var(--seq-3)', 'var(--seq-4)', 'var(--seq-5)'];

function TableToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="t-micro font-medium underline-offset-2 hover:underline"
      style={{ color: 'var(--text-muted)' }}
    >
      {open ? 'Tampilkan grafik' : 'Lihat tabel'}
    </button>
  );
}

function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="scroll-slim max-h-64 overflow-auto">
      <table className="w-full t-label">
        <thead className="sticky top-0" style={{ background: 'var(--bg-base)' }}>
          <tr>
            {head.map((h, i) => (
              <th
                key={h}
                className={`px-2 py-1.5 font-medium ${i === 0 ? 'text-left' : 'text-right'}`}
                style={{ color: 'var(--text-muted)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: '1px solid var(--hairline)' }}>
              {r.map((c, j) => (
                <td key={j} className={`tnum px-2 py-1.5 ${j === 0 ? 'text-left' : 'text-right'}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ───────────────────────── Grafik garis ─────────────────────────

export interface LinePoint {
  label: string;
  value: number;
}

export function LineChart({
  data,
  height = 190,
  format = 'ringkas',
  tooltipFormat = 'rupiah',
  area = true,
}: {
  data: LinePoint[];
  height?: number;
  format?: FormatKey;
  tooltipFormat?: FormatKey;
  area?: boolean;
}) {
  const formatter = fmt(format);
  const tooltipFormatter = fmt(tooltipFormat);
  const uid = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);

  const W = 640;
  const H = height;
  const P = { t: 14, r: 14, b: 26, l: 54 };

  const { pts, ticks, min, max } = useMemo(() => {
    const vals = data.map((d) => d.value);
    const rawMax = Math.max(...vals, 1);
    const rawMin = Math.min(...vals, 0);
    // beri ruang 8% di atas & bawah supaya garis tidak menempel bingkai
    const pad = (rawMax - rawMin) * 0.12 || rawMax * 0.12;
    const max = rawMax + pad;
    const min = Math.max(0, rawMin - pad);
    const iw = W - P.l - P.r;
    const ih = H - P.t - P.b;
    const pts = data.map((d, i) => ({
      x: P.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw),
      y: P.t + ih - ((d.value - min) / (max - min || 1)) * ih,
      ...d,
    }));
    const ticks = [0, 0.5, 1].map((f) => ({
      y: P.t + ih - f * ih,
      v: min + f * (max - min),
    }));
    return { pts, ticks, min, max };
  }, [data, H]);

  if (table) {
    return (
      <div>
        <div className="mb-2 flex justify-end">
          <TableToggle open onToggle={() => setTable(false)} />
        </div>
        <DataTable
          head={['Periode', 'Nilai']}
          rows={data.map((d) => [d.label, tooltipFormatter(d.value)])}
        />
      </div>
    );
  }

  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${path} L${pts[pts.length - 1]?.x.toFixed(1)},${H - P.b} L${pts[0]?.x.toFixed(1)},${H - P.b} Z`;
  const active = hover !== null ? pts[hover] : null;

  return (
    <div>
      <div className="mb-1 flex justify-end">
        <TableToggle open={false} onToggle={() => setTable(true)} />
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height, overflow: 'visible' }}
          role="img"
          aria-label="Tren nilai per periode"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-1)" stopOpacity="0.26" />
              <stop offset="100%" stopColor="var(--series-1)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((t, i) => (
            <g key={i}>
              <line
                x1={P.l}
                x2={W - P.r}
                y1={t.y}
                y2={t.y}
                stroke="var(--grid-line)"
                strokeWidth="1"
              />
              <text
                x={P.l - 8}
                y={t.y + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="var(--axis-text)"
                className="tnum"
              >
                {formatter(t.v)}
              </text>
            </g>
          ))}

          {area && <path d={areaPath} fill={`url(#fill-${uid})`} />}
          <path
            d={path}
            fill="none"
            stroke="var(--series-1)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {pts.map((p, i) => (
            <g key={i}>
              <text
                x={p.x}
                y={H - P.b + 15}
                textAnchor="middle"
                fontSize="10"
                fill="var(--axis-text)"
              >
                {p.label}
              </text>
              {/* cincin permukaan 2px supaya titik tetap terbaca di atas garis */}
              <circle cx={p.x} cy={p.y} r={hover === i ? 5.5 : 3.5} fill="var(--bg-base)" />
              <circle
                cx={p.x}
                cy={p.y}
                r={hover === i ? 4 : 2.5}
                fill="var(--series-1)"
              />
              {/* area tangkap jauh lebih besar dari markanya */}
              <rect
                x={p.x - 24}
                y={0}
                width={48}
                height={H}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                style={{ cursor: 'crosshair' }}
              />
            </g>
          ))}

          {active && (
            <line
              x1={active.x}
              x2={active.x}
              y1={P.t}
              y2={H - P.b}
              stroke="var(--series-1)"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.5"
              pointerEvents="none"
            />
          )}
        </svg>

        {active && (
          <div
            className="glass pointer-events-none absolute z-10 px-2.5 py-1.5 t-micro whitespace-nowrap"
            style={{
              left: `${(active.x / W) * 100}%`,
              top: 0,
              transform: 'translate(-50%, -108%)',
              borderRadius: 10,
            }}
          >
            <div style={{ color: 'var(--text-muted)' }}>{active.label}</div>
            <div className="tnum font-semibold" style={{ color: 'var(--text-strong)' }}>
              {tooltipFormatter(active.value)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────── Batang peringkat horizontal ───────────────────

export interface RankRow {
  label: string;
  value: number;
  /** indeks warna entitas — dijaga tetap agar filter tidak mengecat ulang */
  colorIndex?: number;
  sub?: string;
}

export function BarRank({
  data,
  format = 'ringkas',
  tooltipFormat = 'rupiah',
  colored = false,
}: {
  data: RankRow[];
  format?: FormatKey;
  tooltipFormat?: FormatKey;
  colored?: boolean;
}) {
  const formatter = fmt(format);
  const tooltipFormatter = fmt(tooltipFormat);
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const max = Math.max(...data.map((d) => d.value), 1);

  if (table) {
    return (
      <div>
        <div className="mb-2 flex justify-end">
          <TableToggle open onToggle={() => setTable(false)} />
        </div>
        <DataTable head={['Nama', 'Nilai']} rows={data.map((d) => [d.label, tooltipFormatter(d.value)])} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <TableToggle open={false} onToggle={() => setTable(true)} />
      </div>
      <ul className="space-y-2.5">
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          const color = colored ? seriesColor(d.colorIndex ?? i) : 'var(--series-1)';
          return (
            <li
              key={d.label}
              className="group -mx-1.5 rounded-lg px-1.5 py-1 transition-colors"
              style={{ background: hover === i ? 'var(--field-bg)' : 'transparent' }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-1.5 t-label">
                  {colored && (
                    <span
                      className="size-2 shrink-0 rounded-[3px]"
                      style={{ background: color }}
                      aria-hidden
                    />
                  )}
                  <span className="truncate" style={{ color: 'var(--text-body)' }}>
                    {d.label}
                  </span>
                </span>
                {/* label langsung — identitas & nilai tidak bergantung warna */}
                <span
                  className="tnum shrink-0 t-label font-semibold"
                  style={{ color: 'var(--text-strong)' }}
                >
                  {hover === i ? tooltipFormatter(d.value) : formatter(d.value)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--grid-line)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(pct, 1.5)}%`,
                    background: color,
                    opacity: hover === null || hover === i ? 1 : 0.45,
                  }}
                />
              </div>
              {d.sub && (
                <p className="mt-0.5 t-micro" style={{ color: 'var(--text-muted)' }}>
                  {d.sub}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ───────────────────────── Donat komposisi ─────────────────────────

export function Donut({
  data,
  centerLabel,
  centerValue,
  format = 'rupiah',
}: {
  data: { label: string; value: number }[];
  centerLabel?: string;
  centerValue?: string;
  format?: FormatKey;
}) {
  const formatter = fmt(format);
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  if (table) {
    return (
      <div>
        <div className="mb-2 flex justify-end">
          <TableToggle open onToggle={() => setTable(false)} />
        </div>
        <DataTable
          head={['Komponen', 'Nilai', 'Porsi']}
          rows={data.map((d) => [d.label, formatter(d.value), `${((d.value / total) * 100).toFixed(1)}%`])}
        />
      </div>
    );
  }

  const R = 54;
  const STROKE = 15;
  const C = 2 * Math.PI * R;
  let offset = 0;

  const arcs = data.map((d, i) => {
    const frac = d.value / total;
    // sisakan celah 2px antar segmen sesuai spesifikasi mark
    const len = Math.max(0, frac * C - 2.5);
    const arc = { ...d, i, len, gap: C - len, off: -offset, frac };
    offset += frac * C;
    return arc;
  });

  return (
    <div>
      <div className="mb-1 flex justify-end">
        <TableToggle open={false} onToggle={() => setTable(true)} />
      </div>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <svg viewBox="0 0 140 140" className="size-[140px] shrink-0" role="img" aria-label="Komposisi">
          <g transform="translate(70,70) rotate(-90)">
            <circle r={R} fill="none" stroke="var(--grid-line)" strokeWidth={STROKE} />
            {arcs.map((a) => (
              <circle
                key={a.label}
                r={R}
                fill="none"
                stroke={seriesColor(a.i)}
                strokeWidth={hover === a.i ? STROKE + 4 : STROKE}
                strokeDasharray={`${a.len} ${a.gap}`}
                strokeDashoffset={a.off}
                strokeLinecap="butt"
                opacity={hover === null || hover === a.i ? 1 : 0.35}
                style={{ transition: 'stroke-width .2s, opacity .2s', cursor: 'pointer' }}
                onMouseEnter={() => setHover(a.i)}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </g>
          <text x="70" y="66" textAnchor="middle" fontSize="9" fill="var(--axis-text)">
            {hover !== null ? data[hover].label.slice(0, 18) : centerLabel}
          </text>
          <text
            x="70"
            y="82"
            textAnchor="middle"
            fontSize="13"
            fontWeight="600"
            fill="var(--text-strong)"
            className="tnum"
          >
            {hover !== null ? `${((data[hover].value / total) * 100).toFixed(1)}%` : centerValue}
          </text>
        </svg>

        {/* legenda selalu ada untuk ≥2 seri */}
        <ul className="min-w-0 flex-1 space-y-1.5">
          {data.map((d, i) => (
            <li
              key={d.label}
              className="flex items-center justify-between gap-2 rounded-md px-1.5 py-0.5 t-label transition-colors"
              style={{ background: hover === i ? 'var(--field-bg)' : 'transparent' }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  className="size-2 shrink-0 rounded-[3px]"
                  style={{ background: seriesColor(i) }}
                  aria-hidden
                />
                <span className="truncate" style={{ color: 'var(--text-body)' }}>
                  {d.label}
                </span>
              </span>
              <span className="tnum shrink-0 font-medium" style={{ color: 'var(--text-strong)' }}>
                {formatter(d.value)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ───────────────────────── Garis mini ─────────────────────────

export function Sparkline({
  values,
  width = 88,
  height = 26,
  tone = 'var(--series-1)',
}: {
  values: number[];
  width?: number;
  height?: number;
  tone?: string;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const d = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (width - 3) + 1.5;
      const y = height - 2 - ((v - min) / span) * (height - 5);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="shrink-0" aria-hidden>
      <path d={d} fill="none" stroke={tone} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
}

// ─────────────────── Peta panas kehadiran (sekuensial) ───────────────────

export function Heatmap({
  cells,
  legendLabels = ['sepi', 'padat'],
}: {
  cells: { key: string; label: string; value: number; intensity: number }[];
  legendLabels?: [string, string] | string[];
}) {
  const [hover, setHover] = useState<string | null>(null);
  const active = cells.find((c) => c.key === hover);

  return (
    <div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(14px,1fr))] gap-[3px]">
        {cells.map((c) => (
          <div
            key={c.key}
            className="aspect-square rounded-[3px] transition-transform"
            style={{
              background: c.intensity === 0 ? 'var(--grid-line)' : SEQ[Math.min(4, Math.max(0, c.intensity - 1))],
              transform: hover === c.key ? 'scale(1.35)' : 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={() => setHover(c.key)}
            onMouseLeave={() => setHover(null)}
            title={`${c.label}: ${c.value}`}
          />
        ))}
      </div>
      <div className="mt-2.5 flex items-center justify-between t-micro" style={{ color: 'var(--text-muted)' }}>
        <span className="tnum">{active ? `${active.label} · ${active.value} hadir` : 'Arahkan kursor ke kotak'}</span>
        <span className="flex items-center gap-1">
          {legendLabels[0]}
          {SEQ.map((s) => (
            <span key={s} className="size-2 rounded-[2px]" style={{ background: s }} />
          ))}
          {legendLabels[1]}
        </span>
      </div>
    </div>
  );
}

// ───────────────────────── Batang bertumpuk ─────────────────────────

export function StackedBars({
  data,
  keys,
  format = 'ringkas',
  tooltipFormat = 'rupiah',
  height = 200,
}: {
  data: { label: string; values: number[] }[];
  keys: string[];
  format?: FormatKey;
  tooltipFormat?: FormatKey;
  height?: number;
}) {
  const formatter = fmt(format);
  const tooltipFormatter = fmt(tooltipFormat);
  const [hover, setHover] = useState<{ bar: number; seg: number } | null>(null);
  const [table, setTable] = useState(false);
  const totals = data.map((d) => d.values.reduce((s, v) => s + v, 0));
  const max = Math.max(...totals, 1);

  if (table) {
    return (
      <div>
        <div className="mb-2 flex justify-end">
          <TableToggle open onToggle={() => setTable(false)} />
        </div>
        <DataTable
          head={['Periode', ...keys, 'Total']}
          rows={data.map((d, i) => [
            d.label,
            ...d.values.map((v) => tooltipFormatter(v)),
            tooltipFormatter(totals[i]),
          ])}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {keys.map((k, i) => (
            <li key={k} className="flex items-center gap-1.5 t-micro" style={{ color: 'var(--text-body)' }}>
              <span className="size-2 rounded-[3px]" style={{ background: seriesColor(i) }} aria-hidden />
              {k}
            </li>
          ))}
        </ul>
        <TableToggle open={false} onToggle={() => setTable(true)} />
      </div>

      <div className="relative flex items-end gap-2" style={{ height }} onMouseLeave={() => setHover(null)}>
        {data.map((d, bi) => {
          const total = totals[bi];
          return (
            <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span className="tnum t-micro" style={{ color: 'var(--text-muted)' }}>
                {formatter(total)}
              </span>
              <div
                className="flex w-full max-w-14 flex-col justify-end gap-[2px] overflow-hidden rounded-md"
                style={{ height: (total / max) * (height - 44) }}
              >
                {d.values.map((v, si) => (
                  <div
                    key={si}
                    className="w-full transition-opacity"
                    style={{
                      height: `${(v / (total || 1)) * 100}%`,
                      background: seriesColor(si),
                      opacity: !hover || (hover.bar === bi && hover.seg === si) ? 1 : 0.4,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={() => setHover({ bar: bi, seg: si })}
                  />
                ))}
              </div>
              <span className="truncate t-micro" style={{ color: 'var(--axis-text)' }}>
                {d.label}
              </span>
            </div>
          );
        })}

        {hover && (
          <div
            className="glass pointer-events-none absolute top-0 left-1/2 z-10 -translate-x-1/2 px-2.5 py-1.5 t-micro whitespace-nowrap"
            style={{ borderRadius: 10 }}
          >
            <span style={{ color: 'var(--text-muted)' }}>
              {data[hover.bar].label} · {keys[hover.seg]}
            </span>{' '}
            <span className="tnum font-semibold" style={{ color: 'var(--text-strong)' }}>
              {tooltipFormatter(data[hover.bar].values[hover.seg])}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
