/**
 * Bekal data untuk uji integrasi.
 *
 * Sengaja kecil dan ditulis tangan, bukan memanggil skrip seed. Seed dibuat
 * untuk demo — 26 karyawan dengan angka acak — dan uji yang bergantung pada
 * angka acak tidak menjelaskan apa pun saat gagal. Di sini setiap nilai
 * dipilih supaya batas yang diuji bisa disebutkan dengan tepat: kuota cuti
 * 12 hari, dua hari sudah terpakai, jadi pengajuan 11 hari harus ditolak.
 */

import { prisma } from '../../src/lib/prisma';
import { hashPassword } from '../../src/lib/auth';
import { dariYMD } from '../../src/lib/waktu';
import { SignJWT } from 'jose';

declare global {
  // eslint-disable-next-line no-var
  var __ujiToken: string | undefined;
}

export const SANDI = 'sandi-uji-123';

export interface Bekal {
  aditId: string;
  aditUserId: string;
  aditEmail: string;
  binaId: string;
  binaEmail: string;
  hrEmail: string;
  slipDibayarId: string;
  slipDraftId: string;
  slipBinaId: string;
}

/** Kosongkan seluruh tabel, lalu isi ulang. Dipanggil di before() tiap berkas. */
export async function siapkan(): Promise<Bekal> {
  // Urutannya penting: anak dihapus sebelum induknya.
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payrollItem.deleteMany();
  await prisma.runApproval.deleteMany();
  await prisma.payrollRun.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.overtime.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.employeeComponent.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.position.deleteMany();
  await prisma.department.deleteMany();
  await prisma.approvalStep.deleteMany();
  await prisma.companySetting.deleteMany();

  await prisma.companySetting.create({
    // Sisanya memakai nilai bawaan skema — yang diuji hanya jam masuk dan
    // toleransinya, dan menyebut nilai lain justru mengaburkan itu.
    data: { id: 'singleton', workStart: '09:00', lateToleranceMin: 15 },
  });

  const dept = await prisma.department.create({ data: { name: 'Teknologi', code: 'TEK' } });
  const pos = await prisma.position.create({
    data: { title: 'Pengembang', departmentId: dept.id, level: 'Menengah' },
  });

  const sandi = await hashPassword(SANDI);

  // ── Adit: karyawan utama yang diuji ──
  const aditUser = await prisma.user.create({
    data: { email: 'adit@uji.id', name: 'Adit Uji', password: sandi, role: 'EMPLOYEE' },
  });
  const adit = await prisma.employee.create({
    data: {
      employeeNo: 'UJI-001',
      userId: aditUser.id,
      fullName: 'Adit Uji',
      email: 'adit@uji.id',
      departmentId: dept.id,
      positionId: pos.id,
      joinDate: dariYMD(2023, 1, 10),
      baseSalary: 10_000_000,
      annualLeaveQuota: 12,
      bankName: 'BCA',
      bankAccount: '1234567890',
      bankHolder: 'Adit Uji',
    },
  });

  // ── Bina: karyawan lain, dipakai menguji batas kepemilikan data ──
  const binaUser = await prisma.user.create({
    data: { email: 'bina@uji.id', name: 'Bina Uji', password: sandi, role: 'EMPLOYEE' },
  });
  const bina = await prisma.employee.create({
    data: {
      employeeNo: 'UJI-002',
      userId: binaUser.id,
      fullName: 'Bina Uji',
      email: 'bina@uji.id',
      departmentId: dept.id,
      joinDate: dariYMD(2024, 6, 1),
      baseSalary: 8_000_000,
      annualLeaveQuota: 12,
    },
  });

  // ── HR: dipakai menguji bahwa pengelola boleh bertindak untuk orang lain ──
  await prisma.user.create({
    data: { email: 'hr@uji.id', name: 'HR Uji', password: sandi, role: 'HR' },
  });

  await prisma.user.create({
    data: { email: 'admin@uji.id', name: 'Admin Uji', password: sandi, role: 'ADMIN' },
  });

  // Dua tahap persetujuan: satu tahap saja tidak bisa membuktikan bahwa
  // urutannya ditegakkan maupun bahwa penolakan menghapus persetujuan sebelumnya.
  await prisma.approvalStep.createMany({
    data: [
      { sortOrder: 1, name: 'Diperiksa HRD', role: 'HR' },
      { sortOrder: 2, name: 'Disetujui Direksi', role: 'ADMIN' },
    ],
  });

  // ── akun nonaktif, untuk memastikan penonaktifan benar-benar menutup akses ──
  await prisma.user.create({
    data: { email: 'mati@uji.id', name: 'Sudah Keluar', password: sandi, role: 'EMPLOYEE', isActive: false },
  });

  // Dua hari cuti tahunan yang sudah disetujui — menyisakan kuota 10 hari.
  await prisma.leaveRequest.create({
    data: {
      employeeId: adit.id,
      type: 'ANNUAL',
      startDate: dariYMD(new Date().getUTCFullYear(), 3, 10),
      endDate: dariYMD(new Date().getUTCFullYear(), 3, 11),
      days: 2,
      reason: 'Keperluan keluarga',
      status: 'APPROVED',
    },
  });

  // ── satu periode yang sudah dibayarkan, dan satu yang masih draf ──
  const runDibayar = await prisma.payrollRun.create({
    data: {
      period: '2026-01',
      label: 'Gaji Januari 2026',
      status: 'PAID',
      payDate: dariYMD(2026, 1, 25),
      headcount: 2,
    },
  });
  const runDraft = await prisma.payrollRun.create({
    data: {
      period: '2026-02',
      label: 'Gaji Februari 2026',
      status: 'DRAFT',
      payDate: dariYMD(2026, 2, 25),
    },
  });

  const slipDibayar = await prisma.payrollItem.create({
    data: {
      runId: runDibayar.id,
      employeeId: adit.id,
      baseSalary: 10_000_000,
      grossPay: 11_000_000,
      totalDeduction: 1_000_000,
      netPay: 10_000_000,
      pph21: 400_000,
      presentDays: 20,
      breakdown: JSON.stringify([
        { label: 'Gaji pokok', amount: 10_000_000 },
        { label: 'Tunjangan transport', amount: 1_000_000 },
        { label: 'PPh 21', amount: -400_000 },
        { label: 'BPJS Kesehatan', amount: -600_000 },
      ]),
    },
  });

  // Slip milik periode yang belum dibayarkan — belum boleh dilihat karyawan.
  const slipDraft = await prisma.payrollItem.create({
    data: { runId: runDraft.id, employeeId: adit.id, grossPay: 11_000_000, netPay: 10_000_000 },
  });

  // Slip milik Bina — Adit tidak boleh bisa membukanya.
  const slipBina = await prisma.payrollItem.create({
    data: { runId: runDibayar.id, employeeId: bina.id, grossPay: 8_800_000, netPay: 8_000_000 },
  });

  return {
    aditId: adit.id,
    aditUserId: aditUser.id,
    aditEmail: 'adit@uji.id',
    binaId: bina.id,
    binaEmail: 'bina@uji.id',
    hrEmail: 'hr@uji.id',
    slipDibayarId: slipDibayar.id,
    slipDraftId: slipDraft.id,
    slipBinaId: slipBina.id,
  };
}

export async function tutup() {
  globalThis.__ujiToken = undefined;
  await prisma.$disconnect();
}

/**
 * Masuk sebagai pengguna tertentu untuk memanggil server action.
 *
 * Tokennya JWT sungguhan yang ditandatangani kunci yang sama dan diverifikasi
 * lib/auth.ts seperti biasa — yang dipalsukan hanya jar cookie-nya, karena
 * `cookies()` milik Next hanya ada di dalam lingkup permintaan. Dengan begitu
 * pembatasan peran benar-benar diuji, bukan dilewati.
 */
export async function masuk(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { employee: { select: { id: true } } },
  });
  if (!user) throw new Error(`akun uji tidak ditemukan: ${email}`);

  const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
  globalThis.__ujiToken = await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    employeeId: user.employee?.id ?? null,
    avatarHue: user.avatarHue,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

export function keluar() {
  globalThis.__ujiToken = undefined;
}

/** Aktor bergaya sesi, seperti yang diterima lapisan layanan mandiri. */
export function aktorKaryawan(b: Bekal) {
  return { userId: b.aditUserId, name: 'Adit Uji', role: 'EMPLOYEE' as const, employeeId: b.aditId };
}

export function aktorHr() {
  return { userId: 'hr', name: 'HR Uji', role: 'HR' as const, employeeId: null };
}

/** Bentuk permintaan untuk menguji penangan rute tanpa menjalankan server. */
export function permintaan(
  jalur: string,
  opsi: { metode?: string; token?: string; body?: unknown } = {},
) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opsi.token) h.Authorization = `Bearer ${opsi.token}`;
  return new Request(`http://uji.local/api/mobile${jalur}`, {
    method: opsi.metode ?? (opsi.body ? 'POST' : 'GET'),
    headers: h,
    body: opsi.body === undefined ? undefined : JSON.stringify(opsi.body),
  });
}

/** Baca jawaban rute menjadi bentuk yang mudah diperiksa. */
export async function baca(res: Response) {
  const body = (await res.json()) as { ok: boolean; data?: unknown; error?: string };
  return { status: res.status, ...body };
}

/** Tarif BPJS yang berlaku, dipakai bersama oleh berkas uji yang butuh. */
export const BPJS_UJI = {
  kesEmployeeRate: 1,
  kesEmployerRate: 4,
  kesCap: 12_000_000,
  jhtEmployeeRate: 2,
  jhtEmployerRate: 3.7,
  jpEmployeeRate: 1,
  jpEmployerRate: 2,
  jpCap: 10_547_400,
  jkkRate: 0.24,
  jkmRate: 0.3,
};
