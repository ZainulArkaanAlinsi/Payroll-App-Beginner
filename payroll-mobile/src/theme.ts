import type { TextStyle } from 'react-native';

/**
 * Sistem visual aplikasi karyawan.
 *
 * Polanya mengikuti bahasa dompet digital modern, bukan dasbor HR:
 *
 *   panel gelap membulat di atas  →  angka besar di dalamnya
 *   lembar terang di bawahnya     →  kartu abu lembut berisi rincian
 *   bilah tab berbentuk pil       →  mengambang, tidak menempel tepi
 *
 * Yang membuat pola ini bekerja adalah kontras bidang: satu bidang gelap
 * memegang satu angka penting, lalu semua hal lain duduk tenang di lembar
 * terang. Tanpa pemisahan itu, semua elemen tampak sama penting.
 */

export interface Tema {
  gelap: boolean;

  /** latar aplikasi, di belakang lembar */
  latar: string;
  /** lembar terang tempat sebagian besar isi duduk */
  lembar: string;
  /** kartu abu lembut di atas lembar */
  lembut: string;
  lembutTepi: string;

  /** panel utama — bidang gelap pemegang angka terbesar */
  panel: [string, string];
  panelTeks: string;
  panelRedup: string;
  panelIsian: string;

  tinta: string;
  tintaSedang: string;
  tintaRedup: string;

  merek: string;
  merekLembut: string;

  naik: string;
  naikLembut: string;
  turun: string;
  turunLembut: string;
  tunggu: string;
  tungguLembut: string;

  garis: string;
  bayang: string;
}

export const terang: Tema = {
  gelap: false,

  latar: '#f2f4f6',
  lembar: '#ffffff',
  lembut: '#f4f6f8',
  lembutTepi: 'rgba(16,24,40,0.05)',

  panel: ['#12433a', '#0a2620'],
  panelTeks: '#ffffff',
  panelRedup: 'rgba(255,255,255,0.55)',
  panelIsian: 'rgba(255,255,255,0.12)',

  tinta: '#0f1419',
  tintaSedang: '#4b5563',
  tintaRedup: '#98a2b3',

  merek: '#0f9d6e',
  merekLembut: 'rgba(15,157,110,0.10)',

  naik: '#0f9d6e',
  naikLembut: 'rgba(15,157,110,0.11)',
  turun: '#dc5a4b',
  turunLembut: 'rgba(220,90,75,0.10)',
  tunggu: '#c58a1a',
  tungguLembut: 'rgba(197,138,26,0.12)',

  garis: 'rgba(16,24,40,0.07)',
  bayang: 'rgba(16,24,40,0.10)',
};

export const gelap: Tema = {
  gelap: true,

  latar: '#0b0d0f',
  lembar: '#15181c',
  lembut: '#1c2026',
  lembutTepi: 'rgba(255,255,255,0.05)',

  panel: ['#123b33', '#07120f'],
  panelTeks: '#ffffff',
  panelRedup: 'rgba(255,255,255,0.55)',
  panelIsian: 'rgba(255,255,255,0.11)',

  tinta: '#f4f6f8',
  tintaSedang: '#b6bdc7',
  tintaRedup: '#7d8694',

  merek: '#2fc48c',
  merekLembut: 'rgba(47,196,140,0.14)',

  naik: '#2fc48c',
  naikLembut: 'rgba(47,196,140,0.14)',
  turun: '#e58579',
  turunLembut: 'rgba(229,133,121,0.13)',
  tunggu: '#e0b155',
  tungguLembut: 'rgba(224,177,85,0.14)',

  garis: 'rgba(255,255,255,0.07)',
  bayang: 'rgba(0,0,0,0.5)',
};

/**
 * Skala huruf.
 *
 * Angka saldo dibuat sangat besar dan tebal — itu satu-satunya hal yang
 * benar-benar dicari orang saat membuka aplikasi ini. Sisanya dijaga tetap
 * kecil supaya kontrasnya tidak hilang.
 */
export const teks = {
  saldo: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1.4 },
  saldoKecil: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.9 },
  angka: { fontSize: 21, fontWeight: '700' as const, letterSpacing: -0.4 },

  judul: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4 },
  kepala: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.25 },
  sedang: { fontSize: 15, fontWeight: '600' as const, letterSpacing: -0.1 },
  badan: { fontSize: 14.5, fontWeight: '500' as const },
  kecil: { fontSize: 12.5, fontWeight: '500' as const },
  mikro: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.3 },
};

/** Digit berbaris rapi antar baris. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

export const jarak = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 30 };

/**
 * Lengkung sudut.
 *
 * Besar. Inilah yang paling menentukan kesan lembut dan modern pada pola ini —
 * panel utama 30, kartu 20, pil sepenuhnya bulat.
 */
export const lengkung = { sm: 12, md: 16, lg: 20, xl: 26, xxl: 32, pil: 999 };

/** Sasaran sentuh minimum. Jempol tidak sepresisi tetikus. */
export const SENTUH = 48;

/** Bayangan lembut dan lebar, bukan garis tepi tajam. */
export function bayangan(t: Tema, kuat: 'lembut' | 'apung' = 'lembut') {
  if (kuat === 'apung') {
    return {
      shadowColor: t.bayang,
      shadowOpacity: 1,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
      elevation: 12,
    };
  }
  return {
    shadowColor: t.bayang,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  };
}
