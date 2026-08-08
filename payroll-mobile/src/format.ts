export const rupiah = (n: number) =>
  'Rp ' + Math.round(n).toLocaleString('id-ID');

/** Versi ringkas untuk angka besar di kartu — 4,2 jt, 1,3 M. */
export function rupiahRingkas(n: number) {
  const a = Math.abs(n);
  if (a >= 1_000_000_000) return 'Rp ' + (n / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' M';
  if (a >= 1_000_000) return 'Rp ' + (n / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
  return rupiah(n);
}

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

/**
 * Tanggal kalender — tanggal cuti, tanggal kehadiran, tanggal bayar.
 *
 * Server menyimpannya sebagai tengah malam UTC karena "2 November" harus tetap
 * 2 November di zona mana pun. Karena itu dibaca dengan getter UTC; getter
 * lokal akan menggesernya sehari bagi pengguna di sebelah barat Greenwich.
 */
export function tanggal(iso: string | Date) {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${BULAN[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()}`;
}

/** Hari dan tanggal untuk tanggal kalender. */
export function tanggalKalenderPanjang(iso: string | Date) {
  const d = new Date(iso);
  return `${HARI[d.getUTCDay()]}, ${d.getUTCDate()} ${BULAN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Hari dan tanggal untuk waktu nyata di perangkat — dipakai untuk "sekarang". */
export function tanggalPanjang(saat: Date) {
  return `${HARI[saat.getDay()]}, ${saat.getDate()} ${BULAN[saat.getMonth()]} ${saat.getFullYear()}`;
}

/** Nomor hari dan singkatan harinya, untuk daftar kehadiran. */
export function hariKalender(iso: string | Date) {
  const d = new Date(iso);
  return { angka: d.getUTCDate(), nama: HARI[d.getUTCDay()].slice(0, 3) };
}

/** "YYYY-MM-DD" untuk hari ini menurut jam perangkat, bukan menurut UTC. */
export function isoHariIni() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function namaPeriode(period: string) {
  // "2026-07" atau "2026-06-THR"
  const [y, m] = period.split('-');
  const i = Number(m) - 1;
  return BULAN[i] ? `${BULAN[i]} ${y}` : period;
}

export function jam(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`;
}

export function durasi(menit: number) {
  if (!menit) return '—';
  const j = Math.floor(menit / 60);
  const s = menit % 60;
  return j ? `${j} jam ${s} mnt` : `${s} menit`;
}

export function bulanIni() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function geserBulan(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const salam = () => {
  const j = new Date().getHours();
  if (j < 11) return 'Selamat pagi';
  if (j < 15) return 'Selamat siang';
  if (j < 19) return 'Selamat sore';
  return 'Selamat malam';
};
