/**
 * Warna seri kategorikal.
 *
 * Sengaja diletakkan di modul netral — bukan di dalam berkas grafik yang
 * bertanda 'use client' — supaya halaman server juga bisa memakainya untuk
 * menandai baris tabel dan legenda. Fungsi dari modul klien tidak boleh
 * dipanggil dari server.
 *
 * Urutannya tetap dan tidak pernah didaur ulang: warna mengikuti entitas
 * (departemen ke-n), bukan peringkatnya, sehingga menyaring daftar tidak
 * mengubah warna yang tersisa.
 */

export const SERIES = [
  'var(--series-1)',
  'var(--series-2)',
  'var(--series-3)',
  'var(--series-4)',
  'var(--series-5)',
  'var(--series-6)',
] as const;

export const seriesColor = (i: number) => SERIES[i % SERIES.length];
