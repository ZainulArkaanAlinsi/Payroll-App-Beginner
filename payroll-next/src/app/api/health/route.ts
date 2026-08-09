import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Pemeriksaan kesehatan.
 *
 * Ada satu jenis kerusakan yang tidak terlihat dari luar: aplikasinya tetap
 * melayani halaman, tetapi kehilangan sambungan ke basis data. Penyebabnya
 * biasa terjadi — sandi basis data diputar, variabel lingkungan diubah tanpa
 * penempatan baru, atau penyedia basis datanya gangguan.
 *
 * Gejalanya menyesatkan. Beranda dan halaman masuk tetap menjawab 200 karena
 * keduanya tidak menyentuh basis data, sehingga pemantau yang hanya memeriksa
 * halaman depan melaporkan semuanya baik-baik saja. Yang gagal justru setiap
 * hal yang berarti: masuk, membuka slip, memproses gaji.
 *
 * Rute ini sengaja menyentuh basis data supaya kerusakan itu ikut terbaca, dan
 * menjawab 503 ketika tidak sehat — bukan 200 dengan pesan sedih di dalamnya —
 * karena pemantau membaca kode status, bukan isi jawaban.
 *
 * Yang dilaporkan sengaja kasar: sehat atau tidak, berapa lama, dan seberapa
 * banyak isinya. Tidak ada alamat basis data, nama pengguna, maupun pesan
 * galat mentah, karena rute ini terbuka untuk umum.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  const mulai = Date.now();

  try {
    // Kueri paling murah yang tetap membuktikan sambungannya benar-benar hidup
    // dan tabelnya ada — bukan sekadar soket yang terbuka.
    const karyawan = await prisma.employee.count();
    const ms = Date.now() - mulai;

    return NextResponse.json(
      {
        ok: true,
        data: {
          basisData: 'tersambung',
          karyawan,
          /** Basis data yang terjangkau tetapi kosong tetap berarti rusak
           *  bagi pemakainya: tidak ada yang bisa masuk. */
          berisi: karyawan > 0,
          msJawab: ms,
          waktu: new Date().toISOString(),
        },
      },
      {
        status: karyawan > 0 ? 200 : 503,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  } catch (e) {
    const ms = Date.now() - mulai;

    // Dicatat lengkap di log peladen, tetapi tidak dikirim ke pemanggil:
    // pesan galat Prisma memuat alamat host dan nama basis data.
    console.error('[health] basis data tidak terjangkau', e);

    return NextResponse.json(
      {
        ok: false,
        error: 'Basis data tidak terjangkau.',
        data: { basisData: 'gagal', msJawab: ms, waktu: new Date().toISOString() },
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
