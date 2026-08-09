import type { TextStyle } from 'react-native';

/**
 * Sistem visual aplikasi karyawan.
 *
 * Konsepnya sengaja berbeda dari aplikasi web HR. Web adalah ruang kerja:
 * padat, dingin, banyak tabel. Aplikasi ini bukan itu. Yang dibuka karyawan
 * hanyalah beberapa angka tentang dirinya sendiri — berapa yang masuk, berapa
 * sisa cutinya, jam berapa ia masuk hari ini.
 *
 * Maka acuannya bukan dasbor, melainkan dokumen cetak: slip gaji, amplop,
 * buku besar. Kertas hangat alih-alih grafit dingin. Garis rambut alih-alih
 * kotak di mana-mana. Angka besar yang berbaris rapi seperti kolom pembukuan.
 * Satu warna aksen, dipakai sedikit tetapi berani.
 *
 * Yang sengaja tidak dipakai: kartu bergradien di setiap tempat, ikon dalam
 * lingkaran, dan bayangan tebal pada semua permukaan. Ketiganya membuat setiap
 * elemen tampak sama penting, dan justru itu yang membuat sebuah tampilan
 * terasa dihasilkan mesin alih-alih dipilih.
 */

export interface Tema {
  gelap: boolean;

  /** substrat halaman — kertas atau tinta */
  kertas: string;
  kertasTeduh: string;
  /** permukaan yang terangkat sedikit dari halaman */
  bidang: string;

  /** garis rambut, setipis mungkin — pengganti bingkai kotak */
  garis: string;
  garisTegas: string;

  tinta: string;
  tintaSedang: string;
  tintaPudar: string;

  aksen: string;
  aksenPudar: string;
  aksenAtas: string;

  positif: string;
  negatif: string;
  tunggu: string;

  isian: string;
  isianGaris: string;

  bayang: string;
  /** kekuatan butiran di atas substrat */
  butiran: number;
}

export const terang: Tema = {
  gelap: false,

  kertas: '#f4f1eb',
  kertasTeduh: '#e9e5dc',
  bidang: '#fffdf9',

  garis: 'rgba(28,24,18,0.09)',
  garisTegas: 'rgba(28,24,18,0.18)',

  tinta: '#181512',
  tintaSedang: '#4a443c',
  tintaPudar: '#8a8176',

  aksen: '#186b4f',
  aksenPudar: 'rgba(24,107,79,0.10)',
  aksenAtas: '#fffdf9',

  positif: '#186b4f',
  negatif: '#9a4a3c',
  tunggu: '#8a6420',

  isian: '#fffdf9',
  isianGaris: 'rgba(28,24,18,0.16)',

  bayang: 'rgba(40,32,20,0.10)',
  butiran: 0.5,
};

export const gelap: Tema = {
  gelap: true,

  kertas: '#14120f',
  kertasTeduh: '#0d0c0a',
  bidang: '#1d1a16',

  garis: 'rgba(255,248,235,0.09)',
  garisTegas: 'rgba(255,248,235,0.18)',

  tinta: '#f5f1e9',
  tintaSedang: '#c4bcae',
  tintaPudar: '#8a8276',

  aksen: '#5fbc93',
  aksenPudar: 'rgba(95,188,147,0.13)',
  aksenAtas: '#0b1310',

  positif: '#5fbc93',
  negatif: '#d9938a',
  tunggu: '#d8b273',

  isian: 'rgba(255,248,235,0.05)',
  isianGaris: 'rgba(255,248,235,0.13)',

  bayang: 'rgba(0,0,0,0.55)',
  butiran: 0.35,
};

/**
 * Skala huruf.
 *
 * Lompatannya sengaja lebar, bukan bertahap halus. Skala yang landai membuat
 * semua teks tampak setara, dan mata jadi tidak tahu harus ke mana lebih dulu.
 * Angka uang mendapat dua ukuran tersendiri karena itulah yang dicari orang
 * saat membuka aplikasi ini.
 */
export const teks = {
  angkaBesar: { fontSize: 46, fontWeight: '300' as const, letterSpacing: -2.2 },
  angkaSedang: { fontSize: 30, fontWeight: '400' as const, letterSpacing: -1 },

  judul: { fontSize: 25, fontWeight: '600' as const, letterSpacing: -0.5 },
  kepala: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.25 },
  sedang: { fontSize: 15.5, fontWeight: '600' as const, letterSpacing: -0.1 },
  badan: { fontSize: 15, fontWeight: '400' as const },
  kecil: { fontSize: 13, fontWeight: '400' as const },

  /** label kolom, seperti kepala kolom pada slip cetak */
  kolom: { fontSize: 10.5, fontWeight: '600' as const, letterSpacing: 1.1 },
};

/** Digit berbaris rapi antar baris, seperti kolom angka di buku besar. */
export const angka: TextStyle = { fontVariant: ['tabular-nums'] };

export const jarak = { xs: 4, sm: 8, md: 12, lg: 18, xl: 26, xxl: 38 };

/**
 * Lengkung sudut.
 *
 * Kecil. Dokumen cetak punya sudut tajam; membulatkan segalanya membuat
 * antarmuka kehilangan ketegasannya dan terlihat seperti semua aplikasi lain.
 */
export const lengkung = { sm: 6, md: 10, lg: 14, penuh: 999 };

/**
 * Sasaran sentuh minimum.
 *
 * 48 piksel, bukan 44. Panduan Apple menyebut 44 sebagai batas bawah, dan
 * aplikasi ini sering dibuka sambil berdiri di angkutan umum — di keadaan itu
 * batas bawah terasa kurang.
 */
export const SENTUH = 48;

/** Bayangan tipis, hanya untuk yang benar-benar mengambang. */
export function bayangan(t: Tema, kuat: 'tipis' | 'apung' = 'tipis') {
  if (kuat === 'apung') {
    return {
      shadowColor: t.bayang,
      shadowOpacity: 1,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    };
  }
  return {
    shadowColor: t.bayang,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  };
}
