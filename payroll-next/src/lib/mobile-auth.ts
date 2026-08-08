import 'server-only';

/**
 * Autentikasi untuk aplikasi ponsel.
 *
 * Web memakai cookie httpOnly — aman karena JavaScript halaman tidak bisa
 * membacanya. Aplikasi React Native tidak punya cookie jar yang setara, jadi
 * ia memakai token Bearer yang disimpan di penyimpanan aman perangkat.
 *
 * Token ponsel ditandai `aud: "mobile"` dan berumur 30 hari, sementara token
 * web tidak bertanda dan berumur 7 hari. Pemisahan itu bukan hiasan: token
 * ponsel hidup jauh lebih lama di perangkat yang bisa hilang, jadi ia tidak
 * boleh bisa dipakai ulang sebagai cookie sesi web — dan sebaliknya.
 */

import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './prisma';
import { verifyPassword } from './auth';
import type { Session } from './auth';

const AUD = 'racik-mobile';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 hari

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error('AUTH_SECRET wajib diisi minimal 32 karakter');
  }
  return new TextEncoder().encode(s);
}

export type TokenPayload = Pick<Session, 'userId' | 'email' | 'name' | 'role' | 'employeeId' | 'avatarHue'>;

export async function issueMobileToken(p: TokenPayload) {
  return new SignJWT({ ...p })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setAudience(AUD)
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

/** Baca token dari header Authorization. Null bila tidak ada atau tidak sah. */
export async function readMobileToken(req: Request): Promise<TokenPayload | null> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret(), { audience: AUD });
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as Session['role'],
      employeeId: (payload.employeeId as string) ?? null,
      avatarHue: (payload.avatarHue as number) ?? 160,
    };
  } catch {
    return null;
  }
}

/**
 * Masuk dari ponsel.
 *
 * Sengaja tidak memakai `authenticate()` milik web: fungsi itu menulis cookie
 * lewat `cookies()`, yang tidak ada artinya bagi klien React Native.
 */
export async function loginMobile(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { employee: { select: { id: true } } },
  });
  if (!user || !user.isActive) return null;
  if (!(await verifyPassword(password, user.password))) return null;

  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Session['role'],
    employeeId: user.employee?.id ?? null,
    avatarHue: user.avatarHue,
  };
  return { token: await issueMobileToken(payload), user: payload };
}
