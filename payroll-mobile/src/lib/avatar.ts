/**
 * Avatar karyawan.
 *
 * Selama perusahaan belum mengunggah foto, setiap orang tetap perlu wajah —
 * sesuatu yang bisa dikenali sekilas di dalam daftar 26 baris. Inisial di atas
 * lingkaran berwarna sama untuk semua orang tidak menolong sama sekali;
 * warnanya harus berbeda antar orang dan selalu sama untuk orang yang sama.
 *
 * Warnanya dibangkitkan dari nama, bukan disimpan. Artinya seorang karyawan
 * memiliki warna yang tetap di daftar, di halaman rinciannya, di slip gaji,
 * dan di aplikasi ponselnya — tanpa satu pun kolom tambahan di basis data,
 * dan tanpa perlu diputuskan siapa pun.
 *
 * Berkas ini murni perhitungan, tanpa React, supaya dipakai bersama oleh
 * aplikasi web dan aplikasi ponsel dengan hasil yang persis sama.
 */

/**
 * Palet avatar.
 *
 * Dipilih tangan, bukan dibangkitkan dari roda warna. Warna acak menghasilkan
 * kuning neon di sebelah cokelat lumpur, dan sederet avatar seperti itu
 * membuat halaman tampak berantakan alih-alih hidup. Kedua belas pasangan di
 * bawah sudah diperiksa agar teks putih tetap terbaca di atasnya.
 */
export const PALET_AVATAR: { dari: string; ke: string }[] = [
  { dari: '#4f6ef7', ke: '#2b3fb8' }, // nila
  { dari: '#3aa3f0', ke: '#1a6fb5' }, // langit
  { dari: '#17a2a2', ke: '#0c6e70' }, // pirus
  { dari: '#22a06b', ke: '#12724b' }, // zamrud
  { dari: '#6fa72e', ke: '#4a7318' }, // lumut
  { dari: '#c2960c', ke: '#8a6605' }, // kunyit
  { dari: '#e07a2b', ke: '#a8501a' }, // jingga
  { dari: '#dd5a4e', ke: '#a53a34' }, // bata
  { dari: '#d3457f', ke: '#9c2a58' }, // magenta
  { dari: '#9c56d6', ke: '#6b2fa0' }, // ungu
  { dari: '#6b6fd6', ke: '#43479c' }, // lavender
  { dari: '#5a7184', ke: '#374a59' }, // baja
];

/**
 * Sidik angka dari sebuah teks.
 *
 * Memakai FNV-1a: sederhana, cepat, dan menyebar rata untuk teks pendek —
 * penting supaya dua nama yang mirip seperti "Rina" dan "Rini" tidak jatuh ke
 * warna yang sama.
 */
function sidik(teks: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < teks.length; i++) {
    h ^= teks.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Warna avatar untuk sebuah nama. Selalu sama untuk nama yang sama. */
export function warnaAvatar(nama: string) {
  return PALET_AVATAR[sidik(nama.trim().toLowerCase()) % PALET_AVATAR.length];
}

/**
 * Inisial dari nama.
 *
 * Dua huruf, diambil dari kata pertama dan terakhir. Nama Indonesia sering
 * memuat tiga kata atau lebih — "Adit Nugroho Prakoso" menjadi AP, bukan AN —
 * karena kata terakhir itulah yang biasa dipakai membedakan orang.
 */
export function inisial(nama: string): string {
  const kata = nama.trim().split(/\s+/).filter(Boolean);
  if (kata.length === 0) return '?';
  if (kata.length === 1) return kata[0].slice(0, 2).toUpperCase();
  return (kata[0][0] + kata[kata.length - 1][0]).toUpperCase();
}
