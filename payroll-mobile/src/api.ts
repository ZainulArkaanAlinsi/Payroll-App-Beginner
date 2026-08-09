/**
 * Klien API.
 *
 * Server menjawab dengan bentuk seragam { ok, data } atau { ok, error }, jadi
 * pembungkus ini menerjemahkan kegagalan menjadi ApiError yang membawa pesan
 * dari server — pesan itu ditulis untuk dibaca karyawan, jadi layar tinggal
 * menampilkannya apa adanya alih-alih mengarang pesan sendiri.
 */

import { bacaToken, hapusToken } from './storage';

/**
 * Alamat server.
 *
 * Bawaannya menunjuk ke produksi, bukan localhost. Alasannya sederhana:
 * perangkat asli tidak mengenal "localhost" milik komputer siapa pun, jadi
 * bawaan localhost membuat aplikasi ini gagal pada percobaan pertama semua
 * orang — termasuk yang cuma ingin memindai kode QR untuk melihat hasilnya.
 *
 * Untuk mengembangkan sambil menjalankan server sendiri, isi
 * EXPO_PUBLIC_API_URL dengan alamat IP jaringan lokal komputer, misalnya
 * http://192.168.1.5:3001. Alamat yang sedang dipakai selalu tampil di bagian
 * bawah layar masuk, supaya tidak perlu menebak.
 */
export const API = process.env.EXPO_PUBLIC_API_URL ?? 'https://payroll-app-beginner.vercel.app';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

type Jawaban<T> = { ok: true; data: T } | { ok: false; error: string };

async function kirim<T>(jalur: string, init: RequestInit = {}, pakaiToken = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (pakaiToken) {
    const token = await bacaToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API}/api/mobile${jalur}`, { ...init, headers: { ...headers, ...init.headers } });
  } catch {
    // Bedakan jaringan mati dari server menolak — penyebabnya berbeda jauh,
    // dan karyawan di lapangan lebih sering mengalami yang pertama.
    throw new ApiError('Tidak bisa menghubungi server. Periksa koneksi Anda.', 0);
  }

  let body: Jawaban<T>;
  try {
    body = (await res.json()) as Jawaban<T>;
  } catch {
    throw new ApiError('Jawaban server tidak terbaca.', res.status);
  }

  if (!body.ok) {
    // Token kedaluwarsa: buang supaya aplikasi kembali ke layar masuk
    // alih-alih terus mencoba dengan token mati.
    if (res.status === 401) await hapusToken();
    throw new ApiError(body.error, res.status);
  }

  return body.data;
}

export const api = {
  masuk: (email: string, password: string) =>
    kirim<{ token: string; user: Pengguna }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false),

  saya: () => kirim<Beranda>('/me'),

  absen: (kind: 'IN' | 'OUT') =>
    kirim<{ pesan: string; hariIni: AbsensiHariIni }>('/attendance/clock', {
      method: 'POST',
      body: JSON.stringify({ kind }),
    }),

  kehadiran: (month: string) => kirim<RiwayatKehadiran>(`/attendance?month=${month}`),

  slipGaji: () => kirim<RingkasSlip[]>('/payslips'),
  slipDetail: (id: string) => kirim<SlipDetail>(`/payslips/${id}`),

  cuti: () => kirim<{ daftar: Cuti[]; kuota: Kuota }>('/leave'),
  ajukanCuti: (b: { type: string; startDate: string; endDate: string; reason: string }) =>
    kirim<{ pesan: string }>('/leave', { method: 'POST', body: JSON.stringify(b) }),

  lembur: () => kirim<{ daftar: Lembur[] }>('/overtime'),
  perkiraanLembur: (date: string, hours: number) =>
    kirim<{ perkiraan: number }>('/overtime', {
      method: 'POST',
      body: JSON.stringify({ date, hours, perkiraanSaja: true }),
    }),
  ajukanLembur: (b: { date: string; hours: number; reason: string }) =>
    kirim<{ pesan: string }>('/overtime', { method: 'POST', body: JSON.stringify(b) }),
};

// ───────────────────────────── bentuk data ─────────────────────────────

export interface Pengguna {
  userId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'HR' | 'EMPLOYEE';
  employeeId: string | null;
  avatarHue: number;
}

export interface AbsensiHariIni {
  sudahMasuk: boolean;
  sudahPulang: boolean;
  clockIn: string | null;
  clockOut: string | null;
  status: string | null;
  lateMinutes: number;
  workMinutes: number;
}

export interface Kuota { kuota: number; terpakai: number; sisa: number }

export interface Beranda {
  profil: {
    id: string; employeeNo: string; fullName: string; email: string; phone: string | null;
    joinDate: string; employmentType: string; status: string; ptkpStatus: string;
    bankName: string | null; bankAccount: string | null; bankHolder: string | null;
    department: { name: string } | null;
    position: { title: string } | null;
  };
  hariIni: AbsensiHariIni;
  kuotaCuti: Kuota;
  slipTerakhir: {
    id: string; netPay: number; grossPay: number;
    run: { period: string; label: string; kind: string; payDate: string };
  } | null;
  tertunda: { cuti: number; lembur: number };
  kehadiranBulanIni: Record<string, number>;
}

export interface HariKehadiran {
  id: string; date: string; clockIn: string | null; clockOut: string | null;
  status: string; lateMinutes: number; workMinutes: number;
}

export interface RiwayatKehadiran {
  month: string;
  hari: HariKehadiran[];
  ringkas: Record<string, number>;
  totalMenitTelat: number;
}

export interface RingkasSlip {
  id: string; grossPay: number; netPay: number; pph21: number;
  totalDeduction: number; overtimePay: number; thrAmount: number; transferStatus: string;
  run: { period: string; label: string; kind: string; holidayName: string | null; payDate: string };
}

/**
 * Satu baris rincian slip.
 *
 * Nilainya selalu positif; yang membedakan pendapatan dari potongan adalah
 * `group`, bukan tandanya. Memilah berdasarkan tanda membuat seluruh potongan
 * tampil sebagai pendapatan.
 */
export interface BarisSlip {
  group: 'EARNING' | 'DEDUCTION' | 'EMPLOYER';
  label: string;
  amount: number;
  note?: string;
}

export interface SlipDetail extends RingkasSlip {
  baseSalary: number; allowanceTaxable: number; allowanceNonTax: number;
  bpjsKesEmployee: number; bpjsJhtEmployee: number; bpjsJpEmployee: number;
  loanDeduction: number; lateCut: number; unpaidLeaveCut: number; otherDeduction: number;
  taxAllowance: number; serviceMonths: number; taxMethod: string; terRate: number;
  presentDays: number; absentDays: number; leaveDays: number; overtimeHours: number;
  rincian: BarisSlip[];
  run: RingkasSlip['run'] & { status: string };
  employee: {
    fullName: string; employeeNo: string; ptkpStatus: string;
    bankName: string | null; bankAccount: string | null;
    department: { name: string } | null;
    position: { title: string } | null;
  };
}

export interface Cuti {
  id: string; type: string; startDate: string; endDate: string; days: number;
  reason: string; status: string; reviewNote: string | null; reviewedBy: string | null; createdAt: string;
}

export interface Lembur {
  id: string; date: string; hours: number; isHoliday: boolean; reason: string;
  status: string; amount: number; reviewedBy: string | null; createdAt: string;
}
