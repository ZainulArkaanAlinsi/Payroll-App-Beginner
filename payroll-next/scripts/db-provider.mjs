/**
 * Menyesuaikan datasource Prisma dengan jenis basis data yang dipakai.
 *
 * Di komputer sendiri aplikasi ini memakai SQLite supaya `npm run setup`
 * langsung jalan tanpa memasang apa pun. Di produksi itu tidak bisa: berkas
 * sistem Vercel bersifat baca-saja dan fana, jadi tulisan apa pun hilang —
 * absen tercatat lalu lenyap saat instance berikutnya melayani permintaan.
 *
 * Prisma tidak menerima nama provider dari variabel lingkungan, jadi baris
 * datasource-nya disesuaikan di sini berdasarkan bentuk DATABASE_URL. Skrip
 * ini hanya menulis bila isinya benar-benar berubah, sehingga menjalankannya
 * di komputer sendiri tidak pernah mengotori repositori.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const berkas = join(akar, 'prisma', 'schema.prisma');

const url = process.env.DATABASE_URL ?? '';
const postgres = /^postgres(ql)?:\/\//i.test(url);

/**
 * Neon dan penyedia serupa memberi dua alamat: satu lewat pooler untuk
 * permintaan biasa, satu langsung untuk perubahan skema. `prisma db push`
 * membutuhkan yang langsung; bila tidak disediakan, alamat biasa dipakai.
 */
const punyaDirect = Boolean(process.env.DIRECT_URL);

const blok = postgres
  ? `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")${punyaDirect ? '\n  directUrl = env("DIRECT_URL")' : ''}
}`
  : `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`;

const asli = readFileSync(berkas, 'utf8');

// Berkasnya bisa tersimpan dengan akhir baris CRLF di Windows. Tanpa
// menyesuaikan, blok baru selalu dianggap berbeda dan berkasnya ditulis ulang
// setiap kali — membuat repositori tampak berubah padahal isinya sama.
const crlf = asli.includes('\r\n');
const blokSesuai = crlf ? blok.replace(/\n/g, '\r\n') : blok;

const baru = asli.replace(/datasource db \{[\s\S]*?\}/, blokSesuai);

if (baru === asli) {
  console.log(`· datasource sudah sesuai (${postgres ? 'postgresql' : 'sqlite'})`);
} else {
  writeFileSync(berkas, baru);
  console.log(`· datasource disetel ke ${postgres ? 'postgresql' : 'sqlite'}`);
}
