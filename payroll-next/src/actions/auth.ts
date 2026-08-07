'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { authenticate, destroySession, getSession, audit, homeFor } from '@/lib/auth';

export interface FormState {
  error?: string;
  ok?: boolean;
  message?: string;
}

const loginSchema = z.object({
  email: z.string().email('Format surel tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
});

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const session = await authenticate(parsed.data.email, parsed.data.password);
  if (!session) {
    return { error: 'Surel atau kata sandi salah.' };
  }

  await audit(session, 'LOGIN', 'User', session.userId, `${session.name} masuk ke sistem`);
  // karyawan biasa tidak punya dasbor perusahaan — antar ke portal mandirinya
  redirect(homeFor(session.role));
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await audit(session, 'LOGOUT', 'User', session.userId, `${session.name} keluar dari sistem`);
  }
  await destroySession();
  redirect('/login');
}
