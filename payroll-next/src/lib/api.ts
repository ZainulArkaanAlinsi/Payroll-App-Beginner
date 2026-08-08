import 'server-only';

/**
 * Perkakas bersama untuk API ponsel.
 *
 * Semua jawaban berbentuk sama — `{ ok, data }` atau `{ ok, error }` — supaya
 * klien hanya perlu satu cara membaca hasil, termasuk saat gagal.
 */

import { NextResponse } from 'next/server';
import { readMobileToken, type TokenPayload } from './mobile-auth';

/**
 * Aplikasi React Native tidak tunduk pada CORS, tetapi Expo Web tunduk — dan
 * Expo Web dipakai saat mengembangkan. Header ini hanya dipasang pada
 * /api/mobile, bukan pada aplikasi web HR.
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status, headers: CORS });
}

export function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status, headers: CORS });
}

export function preflight() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/**
 * Jalankan penangan hanya bila tokennya sah.
 *
 * Setiap rute memeriksa sendiri, tidak menitipkannya pada middleware — kalau
 * suatu saat ada rute baru yang lupa didaftarkan di middleware, rute itu
 * terbuka tanpa ada yang menyadarinya.
 */
export async function withAuth(
  req: Request,
  fn: (aktor: TokenPayload) => Promise<Response>,
): Promise<Response> {
  const aktor = await readMobileToken(req);
  if (!aktor) return bad('Sesi berakhir. Silakan masuk kembali.', 401);
  try {
    return await fn(aktor);
  } catch (e) {
    console.error('[api/mobile]', e);
    return bad('Terjadi kesalahan di server.', 500);
  }
}

/** Seperti withAuth, tetapi juga memastikan akunnya tertaut ke data karyawan. */
export async function withEmployee(
  req: Request,
  fn: (aktor: TokenPayload & { employeeId: string }) => Promise<Response>,
): Promise<Response> {
  return withAuth(req, async (aktor) => {
    if (!aktor.employeeId) {
      return bad('Akun ini tidak tertaut ke data karyawan.', 403);
    }
    return fn(aktor as TokenPayload & { employeeId: string });
  });
}

/** Baca body JSON tanpa melempar bila isinya bukan JSON. */
export async function jsonBody<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
