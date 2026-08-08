/**
 * Pengganti `next/headers` untuk pengujian.
 *
 * Server action membaca sesi dari cookie, dan `cookies()` hanya ada di dalam
 * lingkup permintaan Next.js. Di sini jar-nya dipalsukan dan isinya diambil
 * dari `globalThis.__ujiToken`, yang diisi berkas uji sebelum memanggil aksi.
 *
 * Yang dipalsukan hanya pengangkutnya, bukan pemeriksaannya: tokennya tetap
 * JWT sungguhan yang ditandatangani dan diverifikasi lib/auth.ts seperti biasa,
 * jadi uji ini tetap membuktikan pembatasan perannya bekerja.
 */

export async function cookies() {
  return {
    get(nama) {
      const token = globalThis.__ujiToken;
      return nama === 'racik_session' && token ? { name: nama, value: token } : undefined;
    },
    set() {},
    delete() {},
    has(nama) {
      return nama === 'racik_session' && Boolean(globalThis.__ujiToken);
    },
  };
}

export async function headers() {
  return new Headers();
}

export async function draftMode() {
  return { isEnabled: false, enable() {}, disable() {} };
}
