/**
 * Pemeriksaan sebelum dana dikirim ke bank.
 *
 * Berkas transfer massal ditolak atau gagal sebagian karena hal-hal yang
 * sebenarnya bisa diketahui sebelum diunggah: rekening kosong, nomor
 * rekening berisi karakter selain angka, dua karyawan memakai rekening yang
 * sama, atau nominal yang melonjak jauh dari bulan lalu karena salah input.
 *
 * Menemukannya setelah dana keluar jauh lebih mahal daripada menahannya
 * beberapa menit di sini. Karena itu temuan dibagi dua tingkat: penghalang
 * yang menahan ekspor, dan peringatan yang cukup ditinjau.
 */

export type TingkatTemuan = 'PENGHALANG' | 'PERINGATAN';

export interface Temuan {
  tingkat: TingkatTemuan;
  kode: string;
  pesan: string;
  /** karyawan yang terdampak, untuk ditautkan dari daftar temuan */
  terdampak: { id: string; nama: string; catatan?: string }[];
}

export interface BarisTransfer {
  employeeId: string;
  nama: string;
  bankName: string | null;
  bankAccount: string | null;
  bankHolder: string | null;
  netPay: number;
  /** gaji bersih periode sebelumnya, bila ada — untuk mendeteksi lonjakan */
  netPayLalu?: number | null;
}

/** Batas lonjakan yang dianggap mencurigakan dibanding periode sebelumnya. */
const AMBANG_LONJAKAN = 0.5;

export function periksaTransfer(baris: BarisTransfer[]): Temuan[] {
  const temuan: Temuan[] = [];

  const tambah = (
    tingkat: TingkatTemuan,
    kode: string,
    pesan: string,
    terdampak: Temuan['terdampak'],
  ) => {
    if (terdampak.length > 0) temuan.push({ tingkat, kode, pesan, terdampak });
  };

  // ── Penghalang: dana tidak mungkin sampai ──

  tambah(
    'PENGHALANG',
    'REKENING_KOSONG',
    'Nomor rekening belum diisi — bank tidak bisa memproses barisnya.',
    baris.filter((b) => !b.bankAccount?.trim()).map((b) => ({ id: b.employeeId, nama: b.nama })),
  );

  tambah(
    'PENGHALANG',
    'BANK_KOSONG',
    'Nama bank belum diisi.',
    baris
      .filter((b) => b.bankAccount?.trim() && !b.bankName?.trim())
      .map((b) => ({ id: b.employeeId, nama: b.nama })),
  );

  tambah(
    'PENGHALANG',
    'REKENING_BUKAN_ANGKA',
    'Nomor rekening memuat karakter selain angka. Bank menolak berkas yang memuat spasi, tanda hubung, atau titik.',
    baris
      .filter((b) => b.bankAccount?.trim() && !/^\d+$/.test(b.bankAccount.trim()))
      .map((b) => ({ id: b.employeeId, nama: b.nama, catatan: b.bankAccount ?? '' })),
  );

  tambah(
    'PENGHALANG',
    'NOMINAL_TIDAK_SAH',
    'Gaji bersih nol atau negatif — periksa potongannya sebelum dikirim.',
    baris.filter((b) => b.netPay <= 0).map((b) => ({ id: b.employeeId, nama: b.nama })),
  );

  // Rekening kembar hampir selalu berarti salah salin, dan akibatnya satu
  // orang menerima dua kali sementara yang lain tidak menerima apa pun.
  const perRekening = new Map<string, BarisTransfer[]>();
  for (const b of baris) {
    const k = b.bankAccount?.trim();
    if (!k) continue;
    perRekening.set(k, [...(perRekening.get(k) ?? []), b]);
  }
  const kembar = [...perRekening.entries()].filter(([, v]) => v.length > 1);
  tambah(
    'PENGHALANG',
    'REKENING_KEMBAR',
    'Nomor rekening dipakai lebih dari satu karyawan — satu orang akan menerima ganda dan yang lain tidak menerima apa pun.',
    kembar.flatMap(([rek, v]) =>
      v.map((b) => ({ id: b.employeeId, nama: b.nama, catatan: `rekening ${rek}` })),
    ),
  );

  // ── Peringatan: sah secara teknis, tetapi patut ditinjau ──

  tambah(
    'PERINGATAN',
    'NAMA_TIDAK_COCOK',
    'Nama pemilik rekening berbeda dengan nama karyawan. Beberapa bank menolak bila namanya tidak cocok.',
    baris
      .filter(
        (b) =>
          b.bankHolder?.trim() &&
          b.bankHolder.trim().toLowerCase() !== b.nama.trim().toLowerCase(),
      )
      .map((b) => ({ id: b.employeeId, nama: b.nama, catatan: `atas nama ${b.bankHolder}` })),
  );

  tambah(
    'PERINGATAN',
    'LONJAKAN',
    `Gaji bersih berubah lebih dari ${AMBANG_LONJAKAN * 100}% dibanding periode sebelumnya.`,
    baris
      .filter((b) => {
        if (!b.netPayLalu || b.netPayLalu <= 0) return false;
        return Math.abs(b.netPay - b.netPayLalu) / b.netPayLalu > AMBANG_LONJAKAN;
      })
      .map((b) => {
        const selisih = ((b.netPay - b.netPayLalu!) / b.netPayLalu!) * 100;
        return {
          id: b.employeeId,
          nama: b.nama,
          catatan: `${selisih > 0 ? '+' : ''}${selisih.toFixed(0)}% dari periode lalu`,
        };
      }),
  );

  tambah(
    'PERINGATAN',
    'REKENING_PENDEK',
    'Nomor rekening kurang dari 8 angka — periksa kembali, kemungkinan terpotong.',
    baris
      .filter((b) => {
        const r = b.bankAccount?.trim();
        return Boolean(r) && /^\d+$/.test(r!) && r!.length < 8;
      })
      .map((b) => ({ id: b.employeeId, nama: b.nama, catatan: b.bankAccount ?? '' })),
  );

  return temuan;
}

export interface RingkasanTransfer {
  jumlahPenerima: number;
  totalNominal: number;
  perBank: { bank: string; jumlah: number; nominal: number }[];
}

/**
 * Ringkasan instruksi transfer.
 * Dipakai memastikan saldo rekening payroll mencukupi sebelum berkas
 * diunggah — penyebab kegagalan yang paling sering dan paling memalukan.
 */
export function ringkasTransfer(baris: BarisTransfer[]): RingkasanTransfer {
  const perBank = new Map<string, { jumlah: number; nominal: number }>();
  for (const b of baris) {
    const nama = b.bankName?.trim() || 'Tanpa bank';
    const kini = perBank.get(nama) ?? { jumlah: 0, nominal: 0 };
    kini.jumlah += 1;
    kini.nominal += b.netPay;
    perBank.set(nama, kini);
  }

  return {
    jumlahPenerima: baris.length,
    totalNominal: baris.reduce((s, b) => s + b.netPay, 0),
    perBank: [...perBank.entries()]
      .map(([bank, v]) => ({ bank, ...v }))
      .sort((a, b) => b.nominal - a.nominal),
  };
}

export const STATUS_TRANSFER_LABEL: Record<string, string> = {
  PENDING: 'Belum dikirim',
  SENT: 'Sudah ditransfer',
  FAILED: 'Gagal',
  HOLD: 'Ditahan',
};
