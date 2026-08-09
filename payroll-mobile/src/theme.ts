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

  panel: ['#2f5ad9', '#17307e'],
  panelTeks: '#ffffff',
  panelRedup: 'rgba(255,255,255,0.55)',
  panelIsian: 'rgba(255,255,255,0.12)',

  tinta: '#0f1419',
  tintaSedang: '#4b5563',
  tintaRedup: '#98a2b3',

  merek: '#2f5ad9',
  merekLembut: 'rgba(47,90,217,0.10)',

  naik: '#0f9d6e',
  naikLembut: 'rgba(15,157,110,0.11)',
  turun: '#dc5a4b',
  turunLembut: 'rgba(220,90,75,0.10)',
  tunggu: '#c58a1a',
  tungguLembut: 'rgba(197,138,26,0.12)',

  garis: 'rgba(16,24,40,0.07)',
  bayang: 'rgba(23,32,66,0.16)',
};

export const gelap: Tema = {
  gelap: true,

  latar: '#0b0d0f',
  lembar: '#15181c',
  lembut: '#1c2026',
  lembutTepi: 'rgba(255,255,255,0.05)',

  panel: ['#2c50c2', '#111f52'],
  panelTeks: '#ffffff',
  panelRedup: 'rgba(255,255,255,0.55)',
  panelIsian: 'rgba(255,255,255,0.11)',

  tinta: '#f4f6f8',
  tintaSedang: '#b6bdc7',
  tintaRedup: '#7d8694',

  merek: '#6d8dfb',
  merekLembut: 'rgba(109,141,251,0.14)',

  naik: '#2fc48c',
  naikLembut: 'rgba(47,196,140,0.14)',
  turun: '#e58579',
  turunLembut: 'rgba(229,133,121,0.13)',
  tunggu: '#e0b155',
  tungguLembut: 'rgba(224,177,85,0.14)',

  garis: 'rgba(255,255,255,0.07)',
  bayang: 'rgba(0,0,0,0.62)',
};

/**
 * Keluarga huruf: Plus Jakarta Sans.
 *
 * Dipilih karena tiga hal. Bentuknya geometris-humanis, cocok dengan bahasa
 * dompet digital yang dipakai aplikasi ini. Angkanya tegas dan lebarnya sama,
 * penting untuk kolom rupiah. Dan lisensinya SIL Open Font License, yang
 * mengizinkan huruf ini diedarkan maupun dijual bersama perangkat lunak —
 * syarat yang tidak bisa ditawar untuk proyek yang akan dipindahtangankan.
 *
 * React Native tidak menurunkan `fontWeight` ke huruf yang dimuat sendiri:
 * setiap ketebalan adalah berkas tersendiri dan harus disebut namanya. Karena
 * itu setiap tingkat pada skala di bawah menyebut keluarganya secara eksplisit.
 */
export const HURUF = {
  reguler: 'PlusJakartaSans_400Regular',
  sedang: 'PlusJakartaSans_500Medium',
  tebal: 'PlusJakartaSans_600SemiBold',
  beratI: 'PlusJakartaSans_700Bold',
  beratII: 'PlusJakartaSans_800ExtraBold',
} as const;

/**
 * Skala huruf.
 *
 * Angka saldo dibuat sangat besar dan tebal — itu satu-satunya hal yang
 * benar-benar dicari orang saat membuka aplikasi ini. Sisanya dijaga tetap
 * kecil supaya kontrasnya tidak hilang.
 */
export const teks = {
  saldo: { fontFamily: HURUF.beratII, fontSize: 42, letterSpacing: -1.8 },
  saldoKecil: { fontFamily: HURUF.beratII, fontSize: 30, letterSpacing: -1.1 },
  angka: { fontFamily: HURUF.beratI, fontSize: 24, letterSpacing: -0.5 },

  judul: { fontFamily: HURUF.beratI, fontSize: 22, letterSpacing: -0.4 },
  kepala: { fontFamily: HURUF.beratI, fontSize: 18, letterSpacing: -0.3 },
  sedang: { fontFamily: HURUF.tebal, fontSize: 15, letterSpacing: -0.1 },
  badan: { fontFamily: HURUF.sedang, fontSize: 14.5 },
  kecil: { fontFamily: HURUF.sedang, fontSize: 12.5 },
  mikro: { fontFamily: HURUF.beratI, fontSize: 11, letterSpacing: 0.3 },
};

/** Digit berbaris rapi antar baris. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

export const jarak = { xs: 5, sm: 9, md: 14, lg: 18, xl: 26, xxl: 36 };

/**
 * Lengkung sudut.
 *
 * Besar. Inilah yang paling menentukan kesan lembut pada pola ini — sudut
 * bawah panel 36, kartu 22, dan tombol sepenuhnya bulat.
 */
export const lengkung = { sm: 13, md: 17, lg: 22, xl: 28, xxl: 36, pil: 999 };

/** Sasaran sentuh minimum. Jempol tidak sepresisi tetikus. */
export const SENTUH = 48;

/** Bayangan lembut dan lebar, bukan garis tepi tajam. */
export function bayangan(t: Tema, kuat: 'lembut' | 'apung' = 'lembut') {
  if (kuat === 'apung') {
    return {
      shadowColor: t.bayang,
      shadowOpacity: 1,
      shadowRadius: 30,
      shadowOffset: { width: 0, height: 14 },
      elevation: 16,
    };
  }
  return {
    shadowColor: t.bayang,
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  };
}
