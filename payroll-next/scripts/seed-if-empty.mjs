/**
 * Mengisi data contoh hanya bila basis datanya masih kosong.
 *
 * Skrip seed biasa (`npm run db:seed`) menghapus seluruh isi lebih dulu, dan
 * itu memang yang diinginkan saat mengembangkan. Di produksi perilaku itu
 * berbahaya: setiap penempatan baru akan menghapus absensi, pengajuan cuti,
 * dan riwayat gaji yang sudah tercatat.
 *
 * Karena itu di produksi seed hanya berjalan sekali — saat belum ada satu pun
 * pengguna. Penempatan berikutnya melewatinya tanpa menyentuh apa pun.
 */

import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

let jumlah = 0;
try {
  jumlah = await prisma.user.count();
} catch (e) {
  // Tabelnya belum ada berarti basis data memang masih kosong.
  console.log('· tabel belum terbaca, dianggap kosong:', e.message.split('\n')[0]);
} finally {
  await prisma.$disconnect();
}

if (jumlah > 0) {
  console.log(`· basis data sudah berisi ${jumlah} pengguna — seed dilewati`);
  process.exit(0);
}

console.log('· basis data kosong — mengisi data contoh');
const hasil = spawnSync('npx', ['tsx', 'prisma/seed.ts'], {
  cwd: akar,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(hasil.status ?? 1);
