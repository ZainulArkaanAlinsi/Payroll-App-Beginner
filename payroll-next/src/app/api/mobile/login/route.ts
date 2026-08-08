import { bad, jsonBody, ok, preflight } from '@/lib/api';
import { loginMobile } from '@/lib/mobile-auth';

export const OPTIONS = preflight;

export async function POST(req: Request) {
  const body = await jsonBody<{ email?: string; password?: string }>(req);
  if (!body?.email || !body?.password) return bad('Surel dan kata sandi wajib diisi.');

  const hasil = await loginMobile(body.email, body.password);
  // Pesan yang sama untuk surel salah maupun sandi salah — membedakannya
  // memberi tahu penebak bahwa sebuah surel terdaftar.
  if (!hasil) return bad('Surel atau kata sandi salah.', 401);

  return ok(hasil);
}
