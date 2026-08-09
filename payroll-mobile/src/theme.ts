import type { TextStyle } from 'react-native';

/**
 * Sistem visual Racik.
 *
 * Diambil dari aplikasi web supaya keduanya terasa satu produk: grafit dingin
 * dengan satu aksen jade. Yang ditambahkan di sini adalah hal-hal yang hanya
 * ada di ponsel — permukaan kaca, elevasi berlapis, dan gradien untuk kartu
 * utama.
 *
 * Prinsipnya tetap sama: kedalaman dipakai untuk menjelaskan hierarki, bukan
 * sebagai hiasan. Bayangan menandai apa yang bisa disentuh; blur memisahkan
 * lapisan yang mengambang dari isi di bawahnya. Kalau sebuah efek tidak
 * membantu orang memahami apa yang penting, efek itu tidak dipakai.
 */

export interface Tema {
  gelap: boolean;

  // latar
  bg: string;
  bgDalam: string;
  /** gradien latar halaman, dari atas ke bawah */
  bgGradien: [string, string];

  // permukaan
  kartu: string;
  kartuTepi: string;
  /** warna dasar permukaan kaca, di belakang blur */
  kaca: string;
  kacaTepi: string;
  /** garis specular tipis di tepi atas permukaan kaca */
  kilau: string;

  // teks
  kuat: string;
  badan: string;
  redup: string;

  // aksen
  aksen: string;
  aksenLembut: string;
  aksenTeks: string;
  /** gradien kartu utama — kartu saldo, kartu absen */
  aksenGradien: [string, string, string];

  // status
  bahaya: string;
  bahayaLembut: string;
  peringatan: string;
  peringatanLembut: string;

  // isian formulir
  isian: string;
  isianTepi: string;
  isianFokus: string;

  // bayangan
  bayangKartu: string;
  bayangApung: string;
}

export const terang: Tema = {
  gelap: false,

  bg: '#eef0ef',
  bgDalam: '#e3e6e4',
  bgGradien: ['#f2f4f3', '#e6e9e7'],

  kartu: '#ffffff',
  kartuTepi: 'rgba(20,30,35,0.07)',
  kaca: 'rgba(255,255,255,0.72)',
  kacaTepi: 'rgba(255,255,255,0.9)',
  kilau: 'rgba(255,255,255,0.75)',

  kuat: '#12171a',
  badan: '#3a4247',
  redup: '#68727a',

  aksen: '#1f6b52',
  aksenLembut: 'rgba(31,107,82,0.10)',
  aksenTeks: '#ffffff',
  aksenGradien: ['#2f9070', '#1f6b52', '#164e3c'],

  bahaya: '#a0524a',
  bahayaLembut: 'rgba(160,82,74,0.11)',
  peringatan: '#9b742f',
  peringatanLembut: 'rgba(155,116,47,0.13)',

  isian: '#ffffff',
  isianTepi: 'rgba(20,30,35,0.13)',
  isianFokus: 'rgba(31,107,82,0.45)',

  bayangKartu: 'rgba(16,30,36,0.10)',
  bayangApung: 'rgba(16,30,36,0.22)',
};

export const gelap: Tema = {
  gelap: true,

  bg: '#0c0f11',
  bgDalam: '#07090a',
  bgGradien: ['#12171a', '#0a0d0f'],

  kartu: '#161b1e',
  kartuTepi: 'rgba(255,255,255,0.07)',
  kaca: 'rgba(30,37,41,0.62)',
  kacaTepi: 'rgba(255,255,255,0.10)',
  kilau: 'rgba(255,255,255,0.14)',

  kuat: '#f1f5f6',
  badan: '#c3cbd0',
  redup: '#8e999f',

  aksen: '#4fa084',
  aksenLembut: 'rgba(79,160,132,0.14)',
  aksenTeks: '#07120e',
  aksenGradien: ['#2f8a6c', '#20654f', '#144536'],

  bahaya: '#d99a92',
  bahayaLembut: 'rgba(217,154,146,0.13)',
  peringatan: '#d9b878',
  peringatanLembut: 'rgba(217,184,120,0.13)',

  isian: 'rgba(255,255,255,0.05)',
  isianTepi: 'rgba(255,255,255,0.11)',
  isianFokus: 'rgba(79,160,132,0.5)',

  bayangKartu: 'rgba(0,0,0,0.5)',
  bayangApung: 'rgba(0,0,0,0.65)',
};

/**
 * Skala ukuran huruf.
 *
 * Teks isi tidak pernah di bawah 15 piksel: di layar kecil, ukuran yang lebih
 * kecil memaksa orang menyipitkan mata atau memperbesar layar. Angka uang
 * memakai angka bertabular supaya digitnya berbaris rapi antar baris.
 */
export const teks = {
  raksasa: { fontSize: 40, fontWeight: '700' as const, letterSpacing: -1.4 },
  judul: { fontSize: 27, fontWeight: '700' as const, letterSpacing: -0.6 },
  kepala: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.35 },
  sedang: { fontSize: 16, fontWeight: '600' as const, letterSpacing: -0.1 },
  badan: { fontSize: 15, fontWeight: '400' as const },
  label: { fontSize: 13.5, fontWeight: '500' as const },
  mikro: { fontSize: 11.5, fontWeight: '600' as const, letterSpacing: 0.4 },
};

/**
 * Angka uang: digit berbaris rapi antar baris.
 *
 * Tanpa `as const` supaya bisa dipakai langsung sebagai gaya teks — React
 * Native menuntut larik yang bisa diubah pada fontVariant.
 */
export const angka: TextStyle = { fontVariant: ['tabular-nums'] };

export const jarak = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 32 };
export const lengkung = { sm: 10, md: 14, lg: 20, xl: 26, penuh: 999 };

/**
 * Sasaran sentuh minimum.
 *
 * 48 piksel, bukan 44. Panduan Apple menyebut 44 sebagai batas bawah, dan
 * aplikasi ini sering dibuka sambil berjalan atau berdiri di angkutan umum —
 * di keadaan itu batas bawah terasa kurang.
 */
export const SENTUH = 48;

/** Bayangan berlapis: satu tipis untuk kontur, satu lebar untuk kedalaman. */
export function bayangan(t: Tema, tinggi: 'kartu' | 'apung') {
  if (tinggi === 'apung') {
    return {
      shadowColor: t.bayangApung,
      shadowOpacity: 1,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 10 },
      elevation: 10,
    };
  }
  return {
    shadowColor: t.bayangKartu,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  };
}
