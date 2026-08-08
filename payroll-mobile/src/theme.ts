/**
 * Warna diambil dari aplikasi web supaya keduanya terasa satu produk.
 * Grafit dingin dengan satu aksen jade — sengaja diredam, karena aplikasi ini
 * dibuka setiap hari sebelum bekerja, bukan sekali untuk dikagumi.
 */

export interface Tema {
  bg: string; bgDalam: string; kartu: string; kartuTepi: string;
  kuat: string; badan: string; redup: string;
  aksen: string; aksenLembut: string; aksenTeks: string;
  bahaya: string; bahayaLembut: string;
  peringatan: string; peringatanLembut: string;
  isian: string; isianTepi: string;
}

export const terang: Tema = {
  bg: '#eceeec',
  bgDalam: '#e2e5e3',
  kartu: '#ffffff',
  kartuTepi: 'rgba(20,30,35,0.09)',
  kuat: '#14181a',
  badan: '#384146',
  redup: '#5c666c',
  aksen: '#226a53',
  aksenLembut: 'rgba(34,106,83,0.10)',
  aksenTeks: '#ffffff',
  bahaya: '#a85a4f',
  bahayaLembut: 'rgba(168,90,79,0.12)',
  peringatan: '#a87f34',
  peringatanLembut: 'rgba(168,127,52,0.14)',
  isian: '#ffffff',
  isianTepi: 'rgba(20,30,35,0.14)',
};

export const gelap: Tema = {
  bg: '#0d1012',
  bgDalam: '#090b0d',
  kartu: '#161a1d',
  kartuTepi: 'rgba(255,255,255,0.08)',
  kuat: '#f2f5f6',
  badan: '#c5cdd1',
  redup: '#939ea4',
  aksen: '#4fa084',
  aksenLembut: 'rgba(79,160,132,0.14)',
  aksenTeks: '#08110d',
  bahaya: '#d99a92',
  bahayaLembut: 'rgba(217,154,146,0.14)',
  peringatan: '#d9b878',
  peringatanLembut: 'rgba(217,184,120,0.14)',
  isian: 'rgba(255,255,255,0.045)',
  isianTepi: 'rgba(255,255,255,0.12)',
};

/** Satu skala ukuran huruf untuk seluruh aplikasi, seperti di web. */
export const teks = {
  judul: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.5 },
  kepala: { fontSize: 19, fontWeight: '700' as const, letterSpacing: -0.3 },
  sedang: { fontSize: 16, fontWeight: '600' as const },
  badan: { fontSize: 14.5, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '500' as const },
  mikro: { fontSize: 11.5, fontWeight: '500' as const, letterSpacing: 0.2 },
};

export const jarak = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const lengkung = { sm: 8, md: 12, lg: 16, xl: 22 };
