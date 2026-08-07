import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const SESSION_COOKIE = 'racik_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error('AUTH_SECRET wajib diisi minimal 32 karakter (cek file .env)');
  }
  return new TextEncoder().encode(s);
}

export type Role = 'ADMIN' | 'HR' | 'EMPLOYEE';

export interface Session {
  userId: string;
  email: string;
  name: string;
  role: Role;
  employeeId: string | null;
  avatarHue: number;
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hashed: string) {
  return bcrypt.compare(plain, hashed);
}

export async function createSession(payload: Session) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Sesi aktif, atau null bila belum login / token kedaluwarsa. */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as Role,
      employeeId: (payload.employeeId as string) ?? null,
      avatarHue: (payload.avatarHue as number) ?? 160,
    };
  } catch {
    return null;
  }
}

/** Sesi wajib — melempar ke /login bila tidak ada. */
export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect('/login');
  return s;
}

/**
 * Sesi dengan pembatasan peran.
 *
 * Penolakan diarahkan ke /denied, bukan ke /dashboard: karyawan biasa juga
 * tidak berhak atas dasbor, jadi mengarahkan ke sana membuat pengalihan
 * berputar tanpa henti.
 */
export async function requireRole(...roles: Role[]): Promise<Session> {
  const s = await requireSession();
  if (!roles.includes(s.role)) redirect('/denied');
  return s;
}

/** Halaman pertama yang sesuai untuk sebuah peran setelah masuk. */
export function homeFor(role: Role) {
  return role === 'EMPLOYEE' ? '/me' : '/dashboard';
}

export function canManage(role: Role) {
  return role === 'ADMIN' || role === 'HR';
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { employee: { select: { id: true } } },
  });
  if (!user || !user.isActive) return null;
  if (!(await verifyPassword(password, user.password))) return null;

  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  const session: Session = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    employeeId: user.employee?.id ?? null,
    avatarHue: user.avatarHue,
  };
  await createSession(session);
  return session;
}

/** Catat jejak audit. Sengaja tidak melempar error agar tidak menggagalkan aksi utama. */
export async function audit(
  session: Session | null,
  action: string,
  entity: string,
  entityId: string | null,
  summary: string,
  meta?: unknown,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: session?.userId ?? null,
        actorName: session?.name ?? 'Sistem',
        action,
        entity,
        entityId,
        summary,
        meta: meta ? JSON.stringify(meta) : null,
      },
    });
  } catch {
    /* audit gagal tidak boleh membatalkan transaksi bisnis */
  }
}

export async function notify(
  userId: string,
  title: string,
  body: string,
  kind: 'info' | 'success' | 'warning' = 'info',
  href?: string,
) {
  try {
    await prisma.notification.create({ data: { userId, title, body, kind, href } });
  } catch {
    /* diabaikan */
  }
}
