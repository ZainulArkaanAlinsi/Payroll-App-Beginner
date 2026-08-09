import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PALET_AVATAR, inisial, warnaAvatar } from '../src/lib/avatar';

/**
 * Avatar.
 *
 * Warnanya dihitung dari nama, bukan disimpan, sehingga tidak ada satu pun
 * kolom basis data yang menjaganya tetap sama. Yang menjaganya adalah berkas
 * ini: begitu perhitungannya berubah — palet diurutkan ulang, sidiknya
 * diganti, spasi diperlakukan lain — seluruh karyawan berganti warna diam-diam
 * di semua layar sekaligus, dan tidak ada yang menyadarinya sampai ada yang
 * mengeluh bahwa avatarnya "tiba-tiba biru".
 *
 * Nilai tetap di bawah karena itu bukan angka ajaib; itu janji: aplikasi web
 * dan aplikasi ponsel harus mewarnai orang yang sama dengan warna yang sama.
 */

describe('Warna avatar', () => {
  test('nama yang sama selalu memberi warna yang sama', () => {
    for (const nama of ['Adit Nugroho Prakoso', 'Rina', 'Siti Aminah Zahra']) {
      assert.deepEqual(warnaAvatar(nama), warnaAvatar(nama));
    }
  });

  test('huruf besar-kecil dan spasi berlebih tidak mengubahnya', () => {
    // Nama diketik ulang oleh HRD di banyak tempat; ejaannya kerap berbeda
    // spasi. Avatar yang ikut berubah karenanya akan terlihat seperti kutu.
    const acuan = warnaAvatar('Adit Nugroho Prakoso');
    assert.deepEqual(warnaAvatar('  adit nugroho prakoso  '), acuan);
    assert.deepEqual(warnaAvatar('ADIT NUGROHO PRAKOSO'), acuan);
  });

  test('nama yang hanya beda satu huruf tidak jatuh ke warna yang sama', () => {
    // Nama Indonesia banyak yang mirip. Kalau "Rina" dan "Rini" sewarna,
    // avatarnya tidak lagi membantu membedakan siapa pun.
    assert.notDeepEqual(warnaAvatar('Rina'), warnaAvatar('Rini'));
    assert.notDeepEqual(warnaAvatar('Budi Santoso'), warnaAvatar('Budi Santosa'));
  });

  test('selalu mengembalikan pasangan yang benar-benar ada di palet', () => {
    for (const nama of ['', ' ', 'A', 'Zainul Arkaan', '木村', '123']) {
      assert.ok(PALET_AVATAR.includes(warnaAvatar(nama)), `di luar palet: "${nama}"`);
    }
  });

  test('menyebar rata, tidak menumpuk di beberapa warna saja', () => {
    /*
     * Sidik yang buruk tetap lolos semua uji di atas namun memberi sepuluh
     * dari dua belas warna kepada satu orang saja. Dengan 200 nama, sebaran
     * yang wajar memberi sekitar 17 per warna; batas 3× di bawah longgar,
     * cukup untuk menangkap sidik yang benar-benar pincang.
     */
    const depan = ['Adit', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fajar', 'Gita', 'Hadi', 'Indah', 'Joko'];
    const belakang = ['Santoso', 'Wijaya', 'Prakoso', 'Lestari', 'Nugroho'];
    const tengah = ['Putra', 'Ayu', 'Bagus', 'Sari'];

    const hitung = new Map<string, number>();
    for (const d of depan)
      for (const t of tengah)
        for (const b of belakang) {
          const k = warnaAvatar(`${d} ${t} ${b}`).dari;
          hitung.set(k, (hitung.get(k) ?? 0) + 1);
        }

    assert.equal(hitung.size, PALET_AVATAR.length, 'ada warna yang tidak pernah terpakai');
    const rata = 200 / PALET_AVATAR.length;
    for (const [warna, n] of hitung) {
      assert.ok(n <= rata * 3, `warna ${warna} kebagian ${n} dari 200 — sidiknya pincang`);
    }
  });
});

describe('Inisial', () => {
  test('memakai kata pertama dan terakhir, bukan dua kata pertama', () => {
    // Nama Indonesia sering tiga kata atau lebih, dan kata terakhirlah yang
    // biasa dipakai membedakan orang di kantor.
    assert.equal(inisial('Adit Nugroho Prakoso'), 'AP');
    assert.equal(inisial('Siti Aminah Zahra Ramadhani'), 'SR');
  });

  test('dua kata dan satu kata', () => {
    assert.equal(inisial('Budi Santoso'), 'BS');
    assert.equal(inisial('Rina'), 'RI');
  });

  test('nama satu huruf tidak membuatnya jatuh', () => {
    assert.equal(inisial('A'), 'A');
  });

  test('nama kosong tetap memberi sesuatu untuk digambar', () => {
    // Lingkaran kosong tanpa huruf terlihat seperti avatar yang gagal dimuat.
    assert.equal(inisial(''), '?');
    assert.equal(inisial('   '), '?');
  });

  test('spasi berlebih di tengah nama tidak menghasilkan huruf kosong', () => {
    assert.equal(inisial('Budi   Santoso'), 'BS');
  });
});
