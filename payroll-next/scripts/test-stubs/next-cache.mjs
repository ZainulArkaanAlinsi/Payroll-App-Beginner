/**
 * Pengganti `next/cache` untuk pengujian.
 *
 * revalidatePath dan revalidateTag hanya berarti di dalam lingkup permintaan
 * Next.js. Yang diuji di sini adalah perubahan pada basis data, bukan
 * penyegaran tampilan, jadi keduanya cukup dicatat agar bisa diperiksa bila
 * suatu saat memang perlu.
 */

export const jejakRevalidasi = [];

export function revalidatePath(path, type) {
  jejakRevalidasi.push({ jenis: 'path', path, type });
}

export function revalidateTag(tag) {
  jejakRevalidasi.push({ jenis: 'tag', tag });
}

export function unstable_cache(fn) {
  return fn;
}
