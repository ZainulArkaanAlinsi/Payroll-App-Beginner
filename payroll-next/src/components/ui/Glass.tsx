import type { ReactNode } from 'react';

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

export function GlassCard({
  children,
  className,
  hover,
  padded = true,
  style,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padded?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cx('glass', hover && 'glass-hover', padded && 'p-5', className)}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[0.95rem] font-semibold">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Definisi filter SVG untuk efek refraksi kaca. Dipasang sekali di root. */
export function LiquidFilters() {
  return (
    <svg aria-hidden width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <filter id="liquid-refract" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.014" numOctaves="2" seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="1.4" result="soft" />
          <feDisplacementMap in="SourceGraphic" in2="soft" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

type Tone = 'jade' | 'brass' | 'clay' | 'neutral' | 'info';

const TONE: Record<Tone, { bg: string; fg: string; bd: string }> = {
  jade: { bg: 'rgb(46 133 104 / .14)', fg: 'var(--color-jade-500)', bd: 'rgb(46 133 104 / .3)' },
  brass: { bg: 'rgb(168 127 52 / .15)', fg: 'var(--color-brass-500)', bd: 'rgb(168 127 52 / .32)' },
  clay: { bg: 'rgb(168 90 79 / .15)', fg: 'var(--color-clay-500)', bd: 'rgb(168 90 79 / .32)' },
  info: { bg: 'rgb(90 120 140 / .16)', fg: 'var(--text-body)', bd: 'rgb(90 120 140 / .3)' },
  neutral: { bg: 'var(--field-bg)', fg: 'var(--text-muted)', bd: 'var(--hairline)' },
};

export function Chip({
  children,
  tone = 'neutral',
  dot,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  const t = TONE[tone];
  return (
    <span className="chip" style={{ background: t.bg, color: t.fg, borderColor: t.bd }}>
      {dot && (
        <span
          className="inline-block size-1.5 rounded-full"
          style={{ background: 'currentColor' }}
        />
      )}
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  ACTIVE: 'jade', PAID: 'jade', APPROVED: 'jade', PRESENT: 'jade', SUCCESS: 'jade',
  PENDING: 'brass', DRAFT: 'brass', LATE: 'brass', ON_LEAVE: 'brass', PROBATION: 'brass',
  REJECTED: 'clay', ABSENT: 'clay', TERMINATED: 'clay', RESIGNED: 'clay', CANCELLED: 'clay',
  CALCULATED: 'info', WFH: 'info', LEAVE: 'info', CONTRACT: 'info',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Aktif', ON_LEAVE: 'Cuti', RESIGNED: 'Mengundurkan diri', TERMINATED: 'Diberhentikan',
  PERMANENT: 'Tetap', CONTRACT: 'Kontrak', PROBATION: 'Masa percobaan', INTERN: 'Magang',
  DRAFT: 'Draf', CALCULATED: 'Terhitung', APPROVED: 'Disetujui', PAID: 'Dibayarkan',
  PENDING: 'Menunggu', REJECTED: 'Ditolak', CANCELLED: 'Dibatalkan',
  PRESENT: 'Hadir', LATE: 'Terlambat', ABSENT: 'Mangkir', WFH: 'Kerja jarak jauh',
  LEAVE: 'Cuti', HOLIDAY: 'Libur',
  ANNUAL: 'Cuti tahunan', SICK: 'Sakit', UNPAID: 'Cuti di luar tanggungan',
  MATERNITY: 'Cuti melahirkan', SPECIAL: 'Cuti khusus',
  ADMIN: 'Administrator', HR: 'HRD', EMPLOYEE: 'Karyawan',
  INTERN_LVL: 'Magang', STAFF: 'Staf', SENIOR: 'Senior', LEAD: 'Lead',
  MANAGER: 'Manajer', DIRECTOR: 'Direktur',
};

export function statusLabel(s: string) {
  return STATUS_LABEL[s] ?? s;
}

export function StatusChip({ status }: { status: string }) {
  return (
    <Chip tone={STATUS_TONE[status] ?? 'neutral'} dot>
      {statusLabel(status)}
    </Chip>
  );
}

export function Avatar({
  name,
  hue,
  size = 36,
}: {
  name: string;
  hue?: number;
  size?: number;
}) {
  const parts = name.trim().split(/\s+/);
  const ini =
    parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();

  let h = hue;
  if (h === undefined) {
    h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  }

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        // saturasi rendah supaya avatar tidak berteriak di tengah tabel
        background: `linear-gradient(145deg, hsl(${h} 26% 58% / .9), hsl(${(h + 28) % 360} 30% 42% / .95))`,
        color: '#fff',
        letterSpacing: '0.01em',
        boxShadow: 'inset 0 1px 0 rgb(255 255 255 / .25), 0 1px 3px rgb(0 0 0 / .2)',
      }}
    >
      {ini}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon && (
        <div
          className="grid size-11 place-items-center rounded-full"
          style={{ background: 'var(--field-bg)', color: 'var(--text-muted)' }}
        >
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-strong)' }}>
          {title}
        </p>
        {hint && (
          <p className="mx-auto mt-1 max-w-sm text-xs" style={{ color: 'var(--text-muted)' }}>
            {hint}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Bar tipis untuk menunjukkan proporsi di dalam tabel. */
export function MiniBar({ value, max, tone = 'jade' }: { value: number; max: number; tone?: Tone }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--field-bg)' }}>
      <div
        className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${pct}%`, background: TONE[tone].fg, opacity: 0.75 }}
      />
    </div>
  );
}
