import { NextResponse } from 'next/server';
import { jalankanSeed } from '../../../../../prisma/seed';

/**
 * Mengembalikan data demo ke keadaan semula.
 *
 * Demo publik dibuka siapa saja dengan akun admin yang tertulis di README.
 * Artinya pengunjung bisa menghapus periode gaji, mengubah rumus, atau
 * menyetujui pengajuan — dan pengunjung berikutnya menemukan aplikasi yang
 * tampak rusak. Rute ini dijalankan terjadwal supaya demo selalu bersih.
 *
 * MENGAPA DIMATIKAN SECARA BAWAAN
 *
 * Rute ini menghapus seluruh isi basis data sebelum mengisinya kembali. Racik
 * dimaksudkan untuk ditempatkan perusahaan lain, dan penempatan itu berisi
 * data gaji sungguhan. Kalau rute ini aktif dengan sendirinya, satu panggilan
 * terjadwal akan menghapus catatan penggajian nyata.
 *
 * Maka ia menuntut dua hal sekaligus, dan keduanya harus disetel dengan
 * sengaja: DEMO_RESET bernilai "1", dan CRON_SECRET yang cocok. Penempatan
 * biasa tidak punya keduanya, jadi rute ini menjawab 404 seolah tidak ada.
 */

// Seed menyentuh ratusan baris; batas bawaan sepuluh detik tidak cukup.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const nyala = process.env.DEMO_RESET === '1';
  const kunci = process.env.CRON_SECRET;

  // Menjawab 404, bukan 403: penempatan yang bukan demo sebaiknya tidak
  // mengakui bahwa rute ini ada sama sekali.
  if (!nyala || !kunci) {
    return NextResponse.json({ ok: false, error: 'Tidak ditemukan.' }, { status: 404 });
  }

  const dibawa = req.headers.get('authorization');
  if (dibawa !== `Bearer ${kunci}`) {
    return NextResponse.json({ ok: false, error: 'Tidak berhak.' }, { status: 401 });
  }

  const mulai = Date.now();
  try {
    await jalankanSeed();
    const detik = ((Date.now() - mulai) / 1000).toFixed(1);
    console.log(`[reset-demo] data demo dikembalikan dalam ${detik} detik`);
    return NextResponse.json({ ok: true, data: { detik: Number(detik) } });
  } catch (e) {
    console.error('[reset-demo] gagal', e);
    return NextResponse.json({ ok: false, error: 'Pengaturan ulang gagal.' }, { status: 500 });
  }
}
