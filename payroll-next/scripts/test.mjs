/**
 * Penjalan uji.
 *
 * Node hanya memindai berkas berakhiran .test.js secara otomatis, sedangkan
 * berkas uji di sini ditulis dalam TypeScript. Skrip ini mengumpulkan
 * daftarnya lalu menyerahkannya ke penjalan uji bawaan Node — tanpa perlu
 * memasang kerangka uji tambahan, dan tanpa harus menyunting package.json
 * setiap kali ada berkas uji baru.
 *
 * Sebagian uji menyentuh basis data. Uji itu tidak boleh menumpang pada
 * dev.db: menghapus data demo di tengah pekerjaan sangat menjengkelkan, dan
 * uji yang bergantung pada isi basis data yang bisa berubah tidak bisa
 * dipercaya. Maka disiapkan basis data tersendiri yang dibuat ulang setiap
 * kali dijalankan, sehingga hasilnya sama pada mesin siapa pun.
 */

import { readdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'tests');

const berkas = readdirSync(dir)
  .filter((f) => f.endsWith('.test.ts'))
  .sort()
  .map((f) => join('tests', f));

if (berkas.length === 0) {
  console.error('Tidak ada berkas uji di folder tests/.');
  process.exit(1);
}

// ── basis data uji ──────────────────────────────────────────────────
const dbUji = join(root, 'prisma', 'test.db');
for (const sisa of [dbUji, `${dbUji}-journal`]) {
  if (existsSync(sisa)) rmSync(sisa);
}

const env = {
  ...process.env,
  DATABASE_URL: 'file:./test.db',
  // Rute masuk menandatangani JWT, jadi kuncinya harus ada. Nilai tetap
  // dipakai agar hasilnya sama di mesin mana pun; ini bukan kunci produksi.
  AUTH_SECRET: process.env.AUTH_SECRET ?? 'kunci-uji-sepanjang-tiga-puluh-dua-karakter-lebih',
  NODE_ENV: 'test',
};

const siap = spawnSync('npx', ['prisma', 'db', 'push', '--skip-generate'], {
  cwd: root,
  env,
  stdio: ['ignore', 'ignore', 'inherit'],
  shell: process.platform === 'win32',
});

if (siap.status !== 0) {
  console.error('Gagal menyiapkan basis data uji.');
  process.exit(siap.status ?? 1);
}

// ── jalankan ────────────────────────────────────────────────────────
const anak = spawn(
  process.execPath,
  [
    '--import', 'tsx',
    // Memetakan penanda `server-only` dan alias `@/` yang biasanya disediakan
    // Next.js, supaya modul yang diuji tetap modul yang dijalankan produksi.
    '--import', './scripts/test-register.mjs',
    '--test',
    // Berkas uji berbagi satu basis data, jadi dijalankan berurutan.
    '--test-concurrency=1',
    ...process.argv.slice(2),
    ...berkas,
  ],
  { cwd: root, env, stdio: 'inherit' },
);

anak.on('exit', (code) => {
  for (const sisa of [dbUji, `${dbUji}-journal`]) {
    if (existsSync(sisa)) rmSync(sisa, { force: true });
  }
  process.exit(code ?? 1);
});
