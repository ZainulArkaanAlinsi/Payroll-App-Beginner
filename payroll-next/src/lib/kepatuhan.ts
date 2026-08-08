/**
 * Pemeriksaan kepatuhan ketenagakerjaan.
 *
 * Dua aturan yang paling sering terlewat karena tidak menimbulkan galat
 * apa pun di sistem — gajinya tetap terhitung, tetap terbayar, dan baru
 * jadi masalah saat ada pemeriksaan:
 *
 *  · Upah di bawah upah minimum daerah.
 *  · Gaji pokok kurang dari 75% total upah (PP 36/2021 Pasal 7 ayat 2).
 *    Perusahaan kadang menekan gaji pokok dan membesarkan tunjangan agar
 *    dasar pengali BPJS dan pesangon ikut kecil; aturan ini melarangnya.
 */

export type TingkatKepatuhan = 'PELANGGARAN' | 'PERINGATAN';

export interface TemuanKepatuhan {
  tingkat: TingkatKepatuhan;
  kode: string;
  judul: string;
  dasar: string;
  terdampak: { id: string; nama: string; catatan: string }[];
}

export interface BarisKepatuhan {
  id: string;
  nama: string;
  gajiPokok: number;
  /** total tunjangan tetap yang melekat (bukan yang bergantung kehadiran) */
  tunjanganTetap: number;
  status: string;
}

export const RASIO_POKOK_MINIMUM = 0.75;

export function periksaKepatuhan(
  baris: BarisKepatuhan[],
  opsi: { upahMinimum: number; wilayah: string; periksaRasioPokok: boolean },
): TemuanKepatuhan[] {
  const temuan: TemuanKepatuhan[] = [];
  const aktif = baris.filter((b) => b.status === 'ACTIVE');

  // ── Upah minimum ──
  const dibawahUmk = aktif
    .filter((b) => b.gajiPokok + b.tunjanganTetap < opsi.upahMinimum)
    .map((b) => ({
      id: b.id,
      nama: b.nama,
      catatan: `total upah ${(b.gajiPokok + b.tunjanganTetap).toLocaleString('id-ID')} · kurang ${(
        opsi.upahMinimum -
        b.gajiPokok -
        b.tunjanganTetap
      ).toLocaleString('id-ID')}`,
    }));

  if (dibawahUmk.length > 0) {
    temuan.push({
      tingkat: 'PELANGGARAN',
      kode: 'DI_BAWAH_UMK',
      judul: `Total upah di bawah upah minimum ${opsi.wilayah}`,
      dasar: `Upah minimum berlaku Rp ${opsi.upahMinimum.toLocaleString('id-ID')}. Membayar di bawahnya adalah pelanggaran pidana menurut UU Ketenagakerjaan.`,
      terdampak: dibawahUmk,
    });
  }

  // ── Rasio gaji pokok ──
  if (opsi.periksaRasioPokok) {
    const rasioKurang = aktif
      .filter((b) => {
        const total = b.gajiPokok + b.tunjanganTetap;
        // Tanpa tunjangan tetap, rasionya otomatis 100% — tidak perlu diperiksa.
        return total > 0 && b.tunjanganTetap > 0 && b.gajiPokok / total < RASIO_POKOK_MINIMUM;
      })
      .map((b) => {
        const total = b.gajiPokok + b.tunjanganTetap;
        const rasio = (b.gajiPokok / total) * 100;
        const seharusnya = Math.ceil(total * RASIO_POKOK_MINIMUM);
        return {
          id: b.id,
          nama: b.nama,
          catatan: `gaji pokok ${rasio.toFixed(0)}% dari total upah · seharusnya minimal Rp ${seharusnya.toLocaleString('id-ID')}`,
        };
      });

    if (rasioKurang.length > 0) {
      temuan.push({
        tingkat: 'PERINGATAN',
        kode: 'RASIO_POKOK',
        judul: 'Gaji pokok kurang dari 75% total upah',
        dasar:
          'PP 36/2021 Pasal 7 ayat 2 mensyaratkan gaji pokok paling sedikit 75% dari jumlah gaji pokok dan tunjangan tetap. Rasio yang terlalu rendah juga mengecilkan dasar pengali BPJS dan perhitungan pesangon.',
        terdampak: rasioKurang,
      });
    }
  }

  // ── Kelengkapan data yang menghambat kewajiban lain ──
  return temuan;
}
