/**
 * Penjalan uji.
 *
 * Node hanya memindai berkas berakhiran .test.js secara otomatis, sedangkan
 * berkas uji di sini ditulis dalam TypeScript. Skrip ini mengumpulkan
 * daftarnya lalu menyerahkannya ke penjalan uji bawaan Node — tanpa perlu
 * memasang kerangka uji tambahan, dan tanpa harus menyunting package.json
 * setiap kali ada berkas uji baru.
 */

import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

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

const anak = spawn(
  process.execPath,
  ['--import', 'tsx', '--test', ...(process.argv.slice(2)), ...berkas],
  { cwd: root, stdio: 'inherit' },
);

anak.on('exit', (code) => process.exit(code ?? 1));
