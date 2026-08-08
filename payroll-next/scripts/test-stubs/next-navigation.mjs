/**
 * Pengganti `next/navigation` untuk pengujian.
 *
 * redirect() di Next.js bekerja dengan melempar galat khusus yang ditangkap
 * kerangka kerjanya. Perilaku itu ditiru dengan galat bertanda sendiri supaya
 * uji bisa membedakan "dialihkan karena tidak berhak" dari kegagalan lain —
 * penolakan akses memang wujudnya pengalihan, dan itu yang perlu terbukti.
 */

export class RedirectError extends Error {
  constructor(tujuan) {
    super(`REDIRECT ${tujuan}`);
    this.name = 'RedirectError';
    this.tujuan = tujuan;
  }
}

export function redirect(tujuan) {
  throw new RedirectError(tujuan);
}

export function permanentRedirect(tujuan) {
  throw new RedirectError(tujuan);
}

export function notFound() {
  throw new RedirectError('/404');
}
