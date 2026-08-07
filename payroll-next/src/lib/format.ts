const RUPIAH = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const PLAIN = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

export const rupiah = (n: number) => RUPIAH.format(n || 0);
export const angka = (n: number) => PLAIN.format(n || 0);

/** Rp 12,4 jt — untuk kartu ringkas & sumbu grafik. */
export function rupiahRingkas(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}Rp ${(abs / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1).replace('.', ',')} M`;
  if (abs >= 1_000_000) return `${sign}Rp ${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace('.', ',')} jt`;
  if (abs >= 1_000) return `${sign}Rp ${(abs / 1_000).toFixed(0)} rb`;
  return `${sign}Rp ${abs}`;
}

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const namaBulan = (m: number) => BULAN[m - 1] ?? '';
export const bulanPendek = (m: number) => BULAN_PENDEK[m - 1] ?? '';

/** "2025-03" → "Maret 2025" */
export function labelPeriode(period: string): string {
  const [y, m] = period.split('-').map(Number);
  return `${namaBulan(m)} ${y}`;
}

export function tanggal(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.getDate()} ${BULAN_PENDEK[date.getMonth()]} ${date.getFullYear()}`;
}

export function tanggalPanjang(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

export function jam(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return `${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}`;
}

/** "3 hari lalu", "baru saja" */
export function sejak(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const detik = Math.floor((Date.now() - date.getTime()) / 1000);
  if (detik < 60) return 'baru saja';
  if (detik < 3600) return `${Math.floor(detik / 60)} menit lalu`;
  if (detik < 86400) return `${Math.floor(detik / 3600)} jam lalu`;
  if (detik < 2592000) return `${Math.floor(detik / 86400)} hari lalu`;
  return tanggal(date);
}

export function inisial(nama: string): string {
  const parts = nama.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Hue stabil dari string — dipakai untuk warna avatar. */
export function hueDari(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export function periodeSekarang(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function periodeSebelum(period: string, mundur: number): string {
  const [y, m] = period.split('-').map(Number);
  const d = new Date(y, m - 1 - mundur, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function jamMenit(menit: number): string {
  const j = Math.floor(menit / 60);
  const m = menit % 60;
  if (j === 0) return `${m}m`;
  return m === 0 ? `${j}j` : `${j}j ${m}m`;
}
