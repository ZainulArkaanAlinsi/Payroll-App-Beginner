'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { audit, hashPassword, requireRole } from '@/lib/auth';
import { periksa, uraikan, type GalatBaris, type KonteksImpor } from '@/lib/impor-karyawan';

/**
 * Impor karyawan dari CSV.
 *
 * Dua langkah, dan itu disengaja: berkas diperiksa dan ditampilkan sebagai
 * rencana lebih dulu, baru dijalankan setelah pemakainya menyetujui. Satu
 * impor menyentuh gaji seluruh karyawan sekaligus; impor yang langsung menulis
 * mengubah satu salah ketik menjadi delapan puluh gaji yang salah, dan
 * kesalahannya baru ketahuan pada tanggal gajian.
 *
 * Berkasnya dibaca ulang saat dijalankan, bukan mengandalkan rencana yang
 * dikirim balik dari peramban. Rencana yang bolak-balik lewat jaringan bisa
 * disunting di tengah jalan, dan yang disunting di sini adalah nominal gaji.
 */

/** Batas yang masuk akal untuk satu berkas; menahan unggahan yang keliru. */
const BATAS_BARIS = 2000;

export interface RingkasanImpor {
  ok: boolean;
  pesan?: string;
  akanDibuat: number;
  akanDiperbarui: number;
  galat: GalatBaris[];
  /** Beberapa baris pertama, untuk ditunjukkan sebelum disetujui. */
  contoh: { nomor: number; tindakan: string; nama: string; surel: string; gaji: number; catatan: string }[];
}

async function bacaBerkas(fd: FormData): Promise<{ teks: string } | { galat: string }> {
  const berkas = fd.get('berkas');
  if (!(berkas instanceof File) || berkas.size === 0) return { galat: 'Pilih berkas CSV lebih dulu.' };
  if (berkas.size > 2_000_000) return { galat: 'Berkas terlalu besar (maksimal 2 MB).' };
  return { teks: await berkas.text() };
}

async function konteks(): Promise<KonteksImpor> {
  const [karyawan, departemen, posisi] = await Promise.all([
    prisma.employee.findMany({ select: { id: true, employeeNo: true, email: true } }),
    prisma.department.findMany({ select: { id: true, name: true } }),
    prisma.position.findMany({ select: { id: true, title: true } }),
  ]);

  return {
    nomorIndukAda: new Map(karyawan.map((k) => [k.employeeNo, k.id])),
    surelAda: new Map(karyawan.map((k) => [k.email.toLowerCase(), k.id])),
    departemen: new Map(departemen.map((d) => [d.name.toLowerCase(), d.id])),
    posisi: new Map(posisi.map((p) => [p.title.toLowerCase(), p.id])),
  };
}

export async function pratinjauImpor(_prev: unknown, fd: FormData): Promise<RingkasanImpor> {
  await requireRole('ADMIN', 'HR');

  const dibaca = await bacaBerkas(fd);
  if ('galat' in dibaca) return { ok: false, pesan: dibaca.galat, akanDibuat: 0, akanDiperbarui: 0, galat: [], contoh: [] };

  const { baris, galat: galatBerkas } = uraikan(dibaca.teks);
  if (galatBerkas) return { ok: false, pesan: galatBerkas, akanDibuat: 0, akanDiperbarui: 0, galat: [], contoh: [] };
  if (baris.length === 0) {
    return { ok: false, pesan: 'Berkas tidak memuat satu baris data pun.', akanDibuat: 0, akanDiperbarui: 0, galat: [], contoh: [] };
  }
  if (baris.length > BATAS_BARIS) {
    return {
      ok: false,
      pesan: `Berkas memuat ${baris.length} baris, melebihi batas ${BATAS_BARIS}. Pecah menjadi beberapa berkas.`,
      akanDibuat: 0, akanDiperbarui: 0, galat: [], contoh: [],
    };
  }

  const { rencana, galat } = periksa(baris, await konteks());

  return {
    ok: true,
    akanDibuat: rencana.filter((r) => r.tindakan === 'buat').length,
    akanDiperbarui: rencana.filter((r) => r.tindakan === 'perbarui').length,
    galat,
    contoh: rencana.slice(0, 8).map((r) => ({
      nomor: r.nomor,
      tindakan: r.tindakan,
      nama: r.nama,
      surel: r.surel,
      gaji: r.data.baseSalary,
      catatan: r.catatan.join(', '),
    })),
  };
}

export interface HasilImpor {
  ok: boolean;
  pesan: string;
  dibuat?: number;
  diperbarui?: number;
}

export async function jalankanImpor(_prev: unknown, fd: FormData): Promise<HasilImpor> {
  const session = await requireRole('ADMIN', 'HR');

  const dibaca = await bacaBerkas(fd);
  if ('galat' in dibaca) return { ok: false, pesan: dibaca.galat };

  const { baris, galat: galatBerkas } = uraikan(dibaca.teks);
  if (galatBerkas) return { ok: false, pesan: galatBerkas };
  if (baris.length > BATAS_BARIS) return { ok: false, pesan: `Berkas melebihi batas ${BATAS_BARIS} baris.` };

  const { rencana, galat } = periksa(baris, await konteks());

  /*
   * Satu baris galat membatalkan seluruh berkas. Impor separuh jadi
   * meninggalkan keadaan yang tidak diketahui siapa pun: sebagian karyawan
   * sudah berubah, sebagian belum, dan tidak ada catatan mana yang mana.
   */
  if (galat.length > 0) {
    return { ok: false, pesan: `Masih ada ${galat.length} baris bermasalah. Perbaiki berkasnya lalu unggah ulang.` };
  }
  if (rencana.length === 0) return { ok: false, pesan: 'Tidak ada baris yang bisa diimpor.' };

  /*
   * Sandi awal dihitung sekali lalu dipakai ulang. Selain jauh lebih cepat —
   * bcrypt sengaja lambat, dan delapan puluh kali lambat berarti transaksinya
   * kedaluwarsa — semua akun baru memang berbagi sandi awal yang sama dan
   * wajib diganti saat pertama masuk.
   */
  const sandiAwal = await hashPassword('password123');

  const bawaan = await prisma.salaryComponent.findMany({
    where: { isDefault: true, active: true },
    select: { id: true },
  });

  let dibuat = 0;
  let diperbarui = 0;

  await prisma.$transaction(
    async (tx) => {
      // Nomor induk berikutnya dihitung sekali di dalam transaksi, lalu
      // dinaikkan sendiri — memanggil ulang per baris akan memberi nomor
      // yang sama kepada semua karyawan baru.
      const terakhir = await tx.employee.findFirst({
        orderBy: { employeeNo: 'desc' },
        select: { employeeNo: true },
      });
      let urutan = terakhir ? parseInt(terakhir.employeeNo.split('-')[1] ?? '0', 10) : 0;

      for (const r of rencana) {
        if (r.tindakan === 'perbarui' && r.idAda) {
          await tx.employee.update({
            where: { id: r.idAda },
            data: { ...r.data, bankHolder: r.data.fullName },
          });
          // Surel dipakai untuk masuk, jadi akun tertautnya ikut disesuaikan.
          const emp = await tx.employee.findUnique({ where: { id: r.idAda }, select: { userId: true } });
          if (emp?.userId) {
            await tx.user.update({
              where: { id: emp.userId },
              data: { email: r.data.email, name: r.data.fullName },
            });
          }
          diperbarui++;
        } else {
          urutan++;
          const pengguna = await tx.user.create({
            data: {
              email: r.data.email,
              name: r.data.fullName,
              password: sandiAwal,
              role: 'EMPLOYEE',
              avatarHue: 160,
            },
          });
          const baru = await tx.employee.create({
            data: {
              ...r.data,
              bankHolder: r.data.fullName,
              employeeNo: `ND-${String(urutan).padStart(4, '0')}`,
              userId: pengguna.id,
            },
          });
          if (bawaan.length) {
            await tx.employeeComponent.createMany({
              data: bawaan.map((c) => ({ employeeId: baru.id, componentId: c.id })),
            });
          }
          dibuat++;
        }
      }
    },
    // Impor besar melewati batas waktu bawaan Prisma yang lima detik.
    { timeout: 120_000, maxWait: 15_000 },
  );

  await audit(
    session,
    'CREATE',
    'Employee',
    'impor',
    `Impor CSV: ${dibuat} karyawan dibuat, ${diperbarui} diperbarui`,
  );

  revalidatePath('/employees');
  revalidatePath('/dashboard');

  return {
    ok: true,
    pesan:
      `${dibuat} karyawan dibuat, ${diperbarui} diperbarui.` +
      (dibuat > 0 ? ' Akun baru memakai sandi awal "password123".' : ''),
    dibuat,
    diperbarui,
  };
}
