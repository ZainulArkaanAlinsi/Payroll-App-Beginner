/**
 * Tunjangan Hari Raya Keagamaan.
 *
 * Dasar: Permenaker 6/2016 dan PP 36/2021 Pasal 9.
 *
 *  · Wajib dibayarkan paling lambat 7 hari sebelum hari raya keagamaan.
 *  · Masa kerja 12 bulan atau lebih  → 1 bulan upah penuh.
 *  · Masa kerja 1 sampai 12 bulan    → prorata, (masa kerja / 12) x upah.
 *  · Masa kerja kurang dari 1 bulan  → belum berhak.
 *  · Berlaku untuk karyawan tetap maupun kontrak (PKWT dan PKWTT).
 *
 * Yang dimaksud "upah" adalah upah tanpa tunjangan, atau upah pokok
 * ditambah tunjangan tetap — mana pun yang berlaku di perusahaan. Tunjangan
 * tidak tetap seperti uang makan harian tidak ikut dihitung karena
 * nilainya bergantung kehadiran.
 */

export interface HasilThr {
  /** nominal THR sebelum pajak */
  amount: number;
  /** upah sebulan yang dipakai sebagai dasar */
  basis: number;
  /** masa kerja dalam bulan penuh */
  months: number;
  /** true bila menerima satu bulan penuh */
  full: boolean;
  /** penjelasan singkat untuk ditampilkan di slip */
  note: string;
}

export const MASA_KERJA_PENUH = 12;

/** Masa kerja dalam bulan penuh, dari tanggal bergabung sampai tanggal acuan. */
export function masaKerjaBulan(joinDate: Date, acuan: Date): number {
  let bulan =
    (acuan.getFullYear() - joinDate.getFullYear()) * 12 + (acuan.getMonth() - joinDate.getMonth());
  // bulan berjalan baru dihitung penuh setelah melewati tanggal yang sama
  if (acuan.getDate() < joinDate.getDate()) bulan -= 1;
  return Math.max(0, bulan);
}

export function hitungThr(upahSebulan: number, months: number): HasilThr {
  if (months < 1) {
    return {
      amount: 0,
      basis: upahSebulan,
      months,
      full: false,
      note: 'Masa kerja belum genap 1 bulan — belum berhak atas THR.',
    };
  }

  if (months >= MASA_KERJA_PENUH) {
    return {
      amount: Math.round(upahSebulan),
      basis: upahSebulan,
      months,
      full: true,
      note: `Masa kerja ${months} bulan — berhak 1 bulan upah penuh.`,
    };
  }

  const amount = Math.round((upahSebulan * months) / MASA_KERJA_PENUH);
  return {
    amount,
    basis: upahSebulan,
    months,
    full: false,
    note: `Prorata masa kerja ${months}/12 bulan.`,
  };
}

/**
 * PPh 21 atas THR, metode selisih.
 *
 * THR adalah penghasilan tidak teratur. Pajaknya bukan tarif THR dikali
 * tarif tersendiri, melainkan selisih antara pajak atas penghasilan yang
 * sudah termasuk THR dengan pajak atas penghasilan reguler saja. Tanpa
 * cara ini, THR akan dikenai tarif lapisan terendah dan pemotongannya
 * kurang — yang baru ketahuan saat penghitungan ulang akhir tahun.
 */
export function pajakThr(
  brutoReguler: number,
  thr: number,
  hitung: (bruto: number) => number,
): { pajak: number; pajakDenganThr: number; pajakTanpaThr: number } {
  const pajakTanpaThr = hitung(brutoReguler);
  const pajakDenganThr = hitung(brutoReguler + thr);
  return {
    pajak: Math.max(0, pajakDenganThr - pajakTanpaThr),
    pajakDenganThr,
    pajakTanpaThr,
  };
}

/** Batas waktu pembayaran: paling lambat 7 hari sebelum hari raya. */
export function batasPembayaran(tanggalHariRaya: Date): Date {
  const d = new Date(tanggalHariRaya);
  d.setDate(d.getDate() - 7);
  return d;
}
