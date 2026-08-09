import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Kembaran modul avatar.
 *
 * Aplikasi ponsel adalah paket npm tersendiri dengan pembundelnya sendiri,
 * jadi ia tidak bisa mengimpor berkas dari aplikasi web; salinannya terpaksa
 * ada dua. Salinan yang menyimpang tidak akan membuat apa pun gagal dibangun —
 * ia hanya membuat seorang karyawan berwarna hijau di ponselnya dan ungu di
 * layar HRD, dan itu jenis cacat yang tidak pernah dilaporkan siapa pun karena
 * tak seorang pun melihat kedua layar bersamaan.
 *
 * Uji ini yang melihat keduanya. Bila salah satu disunting, perbaikannya cukup
 * satu perintah: salin berkas web menimpa berkas ponsel.
 */

const web = join(process.cwd(), 'src', 'lib', 'avatar.ts');
const ponsel = join(process.cwd(), '..', 'payroll-mobile', 'src', 'lib', 'avatar.ts');

describe('Modul avatar web dan ponsel', () => {
  test('isinya sama persis', { skip: !existsSync(ponsel) && 'folder ponsel tidak ada' }, () => {
    // Akhiran baris dinormalkan lebih dulu: Git di Windows bisa mengubahnya
    // saat berkas diambil, dan itu bukan penyimpangan yang perlu dikeluhkan.
    const bersih = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

    assert.equal(
      bersih(ponsel),
      bersih(web),
      'src/lib/avatar.ts di kedua aplikasi berbeda. Samakan dengan:\n' +
        '  cp payroll-next/src/lib/avatar.ts payroll-mobile/src/lib/avatar.ts',
    );
  });
});
