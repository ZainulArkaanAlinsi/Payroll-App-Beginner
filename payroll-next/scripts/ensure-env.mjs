/**
 * Menyiapkan .env pada penyiapan pertama.
 *
 * .env sengaja tidak ikut masuk ke git, jadi repositori yang baru di-clone
 * belum punya DATABASE_URL — Prisma langsung gagal sebelum sempat jalan.
 * Skrip ini membuatkannya dari .env.example, dengan AUTH_SECRET acak supaya
 * tiap pemasangan tidak berbagi kunci penanda tangan sesi yang sama.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');
const examplePath = join(root, '.env.example');

if (existsSync(envPath)) {
  console.log('› .env sudah ada — dibiarkan apa adanya.');
  process.exit(0);
}

if (!existsSync(examplePath)) {
  console.error('✗ .env.example tidak ditemukan. Buat .env secara manual:');
  console.error('  DATABASE_URL="file:./dev.db"');
  console.error('  AUTH_SECRET="<string acak minimal 32 karakter>"');
  process.exit(1);
}

const secret = randomBytes(32).toString('base64url');
const isi = readFileSync(examplePath, 'utf8').replace(
  /^AUTH_SECRET=.*$/m,
  `AUTH_SECRET="${secret}"`,
);

writeFileSync(envPath, isi);
console.log('› .env dibuat dari .env.example dengan AUTH_SECRET acak.');
