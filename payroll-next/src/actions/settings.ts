'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { audit, hashPassword, requireRole, requireSession, verifyPassword } from '@/lib/auth';
import { FAIL, OK, type ActionState } from '@/lib/types';

/** Isian teks pilihan: kosong disimpan sebagai null, bukan string kosong. */
const kosongJadiNull = z
  .string()
  .trim()
  .default('')
  .transform((v) => (v === '' ? null : v));

const schema = z.object({
  name: z.string().min(3, 'Nama perusahaan minimal 3 karakter'),
  legalName: z.string().min(3, 'Nama badan hukum minimal 3 karakter'),
  npwp: z.string().min(5, 'NPWP tidak valid'),
  address: z.string().min(10, 'Alamat terlalu pendek'),
  // kolom ini non-null di skema, jadi kosong disimpan sebagai string kosong
  phone: z.string().default(''),
  email: z.string().email('Format surel tidak valid'),
  logoInitials: z.string().min(1).max(3),

  workStart: z.string().regex(/^\d{2}:\d{2}$/, 'Format jam harus HH:MM'),
  workEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Format jam harus HH:MM'),
  workDays: z.coerce.number().int().min(1).max(7),
  lateToleranceMin: z.coerce.number().int().min(0).max(120),

  /*
   * Rekening penyalur boleh kosong: perusahaan yang baru memasang sistem ini
   * belum tentu sudah memutuskan rekening mana yang dipakai. Kolomnya nullable
   * di skema, jadi kosong disimpan sebagai null — bukan string kosong — supaya
   * "belum diisi" hanya punya satu wujud dan pemeriksaannya cukup satu cara.
   */
  payoutBankName: kosongJadiNull,
  payoutBankAccount: z
    .string()
    .trim()
    .default('')
    .refine(
      (v) => v === '' || /^[0-9][0-9 -]{4,24}$/.test(v),
      'Nomor rekening hanya boleh berisi angka, spasi, atau tanda hubung',
    )
    .transform((v) => (v === '' ? null : v)),
  payoutBankHolder: kosongJadiNull,

  payDay: z.coerce.number().int().min(1).max(31),
  cutoffDay: z.coerce.number().int().min(1).max(31),

  bpjsKesEmployeeRate: z.coerce.number().min(0).max(20),
  bpjsKesEmployerRate: z.coerce.number().min(0).max(20),
  bpjsKesCap: z.coerce.number().int().min(0),
  bpjsJhtEmployeeRate: z.coerce.number().min(0).max(20),
  bpjsJhtEmployerRate: z.coerce.number().min(0).max(20),
  bpjsJpEmployeeRate: z.coerce.number().min(0).max(20),
  bpjsJpEmployerRate: z.coerce.number().min(0).max(20),
  bpjsJpCap: z.coerce.number().int().min(0),
  bpjsJkkRate: z.coerce.number().min(0).max(20),
  bpjsJkmRate: z.coerce.number().min(0).max(20),

  lateCutPerMinute: z.coerce.number().int().min(0),
  absentCutPerDay: z.boolean(),

  minimumWage: z.coerce.number().int().min(0),
  minimumWageRegion: z.string().min(2, 'Nama wilayah minimal 2 karakter'),
  enforceBasicRatio: z.boolean(),
});

export async function saveSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = await requireRole('ADMIN');

  const raw: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) raw[k] = v;
  raw.absentCutPerDay = fd.get('absentCutPerDay') === 'on';
  raw.enforceBasicRatio = fd.get('enforceBasicRatio') === 'on';

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return FAIL(`${i.path.join('.')}: ${i.message}`);
  }

  await prisma.companySetting.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...parsed.data },
    update: parsed.data,
  });

  await audit(session, 'UPDATE', 'CompanySetting', 'singleton', 'Pengaturan perusahaan diperbarui');
  revalidatePath('/settings');
  revalidatePath('/', 'layout');
  return OK('Pengaturan tersimpan. Hitung ulang payroll agar tarif baru berlaku.');
}

const passwordSchema = z
  .object({
    current: z.string().min(1, 'Kata sandi saat ini wajib diisi'),
    next: z.string().min(8, 'Kata sandi baru minimal 8 karakter'),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { message: 'Konfirmasi kata sandi tidak cocok.' });

export async function changePassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const session = await requireSession();
  const parsed = passwordSchema.safeParse({
    current: fd.get('current'),
    next: fd.get('next'),
    confirm: fd.get('confirm'),
  });
  if (!parsed.success) return FAIL(parsed.error.issues[0].message);

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return FAIL('Akun tidak ditemukan.');
  if (!(await verifyPassword(parsed.data.current, user.password))) {
    return FAIL('Kata sandi saat ini salah.');
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { password: await hashPassword(parsed.data.next) },
  });

  await audit(session, 'UPDATE', 'User', session.userId, 'Kata sandi diganti');
  return OK('Kata sandi berhasil diganti.');
}
