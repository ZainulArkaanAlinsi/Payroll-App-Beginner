/**
 * Kait resolusi modul untuk pengujian.
 *
 * Berkas di src/ ditulis untuk dijalankan Next.js, yang menyediakan dua hal
 * yang tidak ada di Node polos:
 *
 *   1. Penanda `server-only`. Next.js meng-alias-nya saat build; paketnya
 *      sendiri tidak terpasang, jadi impornya gagal di luar Next. Di sini ia
 *      dipetakan ke modul kosong — penanda itu memang tidak punya perilaku,
 *      tugasnya cuma menggagalkan impor dari komponen klien.
 *
 *   2. Alias `@/` ke src/. Ini setelan tsconfig yang dipahami penyusun, bukan
 *      Node, sehingga rute API yang mengimpor `@/lib/api` tidak bisa dimuat
 *      tanpa pemetaan ini.
 *
 * Dipakai lewat kait resolusi, bukan dengan memasang paket tambahan atau
 * mengubah kode sumber agar lebih mudah diuji — kode yang diuji harus tetap
 * kode yang benar-benar dijalankan di produksi.
 */

import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(akar, 'src');
const stub = join(akar, 'scripts', 'test-stubs');
const KOSONG = 'data:text/javascript,export%20%7B%7D';

/**
 * Modul Next.js yang hanya berarti di dalam lingkup permintaan.
 *
 * Server action membaca cookie, menyegarkan cache, dan mengalihkan halaman.
 * Ketiganya tidak ada artinya di luar Next, jadi diganti tiruan yang tetap
 * mempertahankan perilaku yang diuji — terutama pengalihan, karena penolakan
 * akses wujudnya memang pengalihan.
 */
const NEXT = {
  'next/headers': join(stub, 'next-headers.mjs'),
  'next/cache': join(stub, 'next-cache.mjs'),
  'next/navigation': join(stub, 'next-navigation.mjs'),
};

export async function resolve(specifier, context, next) {
  if (specifier === 'server-only' || specifier === 'client-only') {
    return { url: KOSONG, format: 'module', shortCircuit: true };
  }

  if (NEXT[specifier]) {
    return { url: pathToFileURL(NEXT[specifier]).href, format: 'module', shortCircuit: true };
  }

  if (specifier.startsWith('@/')) {
    return next(pathToFileURL(join(src, specifier.slice(2))).href, context);
  }

  return next(specifier, context);
}
