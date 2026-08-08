/**
 * Tanggal kalender dan waktu operasional.
 *
 * Ada dua jenis waktu di aplikasi ini, dan menyamakannya menimbulkan kesalahan
 * yang diam-diam:
 *
 *   1. Titik waktu — jam absen masuk. Ini momen nyata, disimpan apa adanya.
 *   2. Tanggal kalender — tanggal cuti, periode gaji, tanggal kehadiran. Ini
 *      bukan momen; "2 November" tetap 2 November di mana pun servernya.
 *
 * Sebelumnya tanggal kalender dibuat dengan `new Date(y, m, d)`, yang berarti
 * tengah malam menurut zona waktu mesin yang menjalankan kode. Di laptop
 * pengembang (WIB) hasilnya satu, di server produksi (UTC) hasilnya lain —
 * tanggal yang sama tersimpan tujuh jam berbeda. Ambang keterlambatan lebih
 * parah lagi: `setHours(9, 15)` di server UTC berarti pukul 16.15 WIB,
 * sehingga tidak ada seorang pun yang pernah tercatat terlambat.
 *
 * Maka tanggal kalender selalu disimpan sebagai tengah malam UTC, dan jam
 * kerja selalu ditafsirkan menurut zona perusahaan — bukan zona server.
 */

/**
 * Selisih zona operasional perusahaan terhadap UTC, dalam menit.
 *
 * Indonesia tidak menerapkan waktu musim panas, jadi angka ini tetap sepanjang
 * tahun dan tidak memerlukan tabel peralihan. Perusahaan yang beroperasi di
 * WITA atau WIT tinggal mengubah nilainya di satu tempat ini.
 */
export const OFFSET_MENIT = 7 * 60; // WIB, UTC+7

const HARI_MS = 86_400_000;

/** Tanggal kalender "YYYY-MM-DD" menurut zona perusahaan. */
export function isoTanggal(saat: Date = new Date()): string {
  const geser = new Date(saat.getTime() + OFFSET_MENIT * 60_000);
  return geser.toISOString().slice(0, 10);
}

/**
 * "YYYY-MM-DD" menjadi tanggal kalender.
 *
 * Melempar bila bentuknya tidak dikenali — tanggal yang salah baca lebih
 * berbahaya daripada penolakan, karena hasilnya berupa angka yang tampak wajar.
 */
export function kalender(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!m) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) throw new RangeError(`Tanggal tidak terbaca: ${iso}`);
    return kalender(isoTanggal(d));
  }
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

/** Tanggal kalender dari komponen. Bulan 1–12, bukan 0–11. */
export function dariYMD(tahun: number, bulan: number, hari: number): Date {
  return new Date(Date.UTC(tahun, bulan - 1, hari));
}

/** Tanggal kalender hari ini menurut zona perusahaan. */
export function hariIni(saat: Date = new Date()): Date {
  return kalender(isoTanggal(saat));
}

/** Tanggal kalender awal bulan berjalan. */
export function awalBulan(saat: Date = new Date()): Date {
  const iso = isoTanggal(saat);
  return kalender(`${iso.slice(0, 7)}-01`);
}

/**
 * Titik waktu nyata untuk pukul sekian menurut zona perusahaan, pada sebuah
 * tanggal kalender. Dipakai untuk ambang keterlambatan dan jam pulang.
 */
export function pukul(tanggalKalender: Date, jam: number, menit = 0): Date {
  return new Date(tanggalKalender.getTime() + (jam * 60 + menit - OFFSET_MENIT) * 60_000);
}

/** Hari dalam pekan untuk tanggal kalender. 0 Minggu … 6 Sabtu. */
export function hariPekan(tanggalKalender: Date): number {
  return tanggalKalender.getUTCDay();
}

/** Benar bila tanggal kalender jatuh pada Sabtu atau Minggu. */
export function akhirPekan(tanggalKalender: Date): boolean {
  const h = hariPekan(tanggalKalender);
  return h === 0 || h === 6;
}

/** Geser tanggal kalender sekian hari. */
export function tambahHari(tanggalKalender: Date, hari: number): Date {
  return new Date(tanggalKalender.getTime() + hari * HARI_MS);
}

/** Selisih hari antara dua tanggal kalender. */
export function selisihHari(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / HARI_MS);
}
