import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  bacaRupiah, bacaTanggal, periksa, uraikan,
  type KonteksImpor,
} from '../src/lib/impor-karyawan';

/**
 * Impor karyawan.
 *
 * Berkas yang diimpor datang dari Excel di komputer orang lain, bukan dari
 * sistem ini — jadi yang diuji di sini bukan jalur bahagianya, melainkan
 * bentuk-bentuk yang sebenarnya akan datang: pemisah titik koma, angka
 * berpemisah ribuan, tanggal hari-dulu, dan istilah Indonesia alih-alih kode.
 *
 * Satu impor menyentuh gaji seluruh karyawan sekaligus. Baris yang diterima
 * padahal seharusnya ditolak tidak menimbulkan galat apa pun — ia hanya
 * menghasilkan gaji yang salah pada tanggal gajian berikutnya.
 */

const JUDUL =
  'Nomor Induk;Nama Lengkap;Surel;Telepon;NIK;NPWP;Departemen;Posisi;' +
  'Tanggal Bergabung;Jenis Hubungan Kerja;Status;Gaji Pokok;Status PTKP;Bank;Nomor Rekening';

function konteks(ubah: Partial<KonteksImpor> = {}): KonteksImpor {
  return {
    nomorIndukAda: new Map([['ND-0001', 'emp-1']]),
    surelAda: new Map([['adit@nusantaradigital.id', 'emp-1']]),
    departemen: new Map([['teknologi', 'dep-1'], ['keuangan', 'dep-2']]),
    posisi: new Map([['backend engineer', 'pos-1']]),
    ...ubah,
  };
}

const jalankan = (csv: string, ctx = konteks()) => {
  const { baris, galat } = uraikan(csv);
  assert.equal(galat, null, `berkas ditolak: ${galat}`);
  return periksa(baris, ctx);
};

describe('Membaca angka rupiah', () => {
  test('menerima bentuk yang ditulis orang Indonesia', () => {
    assert.equal(bacaRupiah('52000000'), 52_000_000);
    assert.equal(bacaRupiah('52.000.000'), 52_000_000);
    assert.equal(bacaRupiah('Rp 52.000.000'), 52_000_000);
    assert.equal(bacaRupiah(' Rp52.000.000 '), 52_000_000);
  });

  test('menolak yang tidak bisa dibaca, bukan menebaknya', () => {
    // Menebak "dua juta" atau membulatkan "5.000,50" akan menghasilkan gaji
    // yang salah tanpa satu pun tanda bahwa ada yang keliru.
    for (const buruk of ['', 'dua juta', '5.000,50', '12abc', '-']) {
      assert.equal(bacaRupiah(buruk), null, `seharusnya ditolak: "${buruk}"`);
    }
  });
});

describe('Membaca tanggal', () => {
  test('menerima ISO maupun urutan hari-dulu', () => {
    assert.equal(bacaTanggal('2024-05-16')!.toISOString(), '2024-05-16T00:00:00.000Z');
    assert.equal(bacaTanggal('16/05/2024')!.toISOString(), '2024-05-16T00:00:00.000Z');
    assert.equal(bacaTanggal('16-05-2024')!.toISOString(), '2024-05-16T00:00:00.000Z');
  });

  test('membaca 05/06/2024 sebagai 5 Juni, bukan 6 Mei', () => {
    // Urutan bulan-dulu ala Amerika akan menggeser tanggal bergabung tanpa
    // terlihat salah, dan tanggal itu ikut menentukan masa kerja serta THR.
    assert.equal(bacaTanggal('05/06/2024')!.toISOString(), '2024-06-05T00:00:00.000Z');
  });

  test('menolak tanggal yang tidak ada', () => {
    for (const buruk of ['31/02/2024', '2024-13-01', '2024-02-30', 'kemarin', '']) {
      assert.equal(bacaTanggal(buruk), null, `seharusnya ditolak: "${buruk}"`);
    }
  });
});

describe('Menguraikan berkas', () => {
  test('menerima berkas ber-BOM dan berakhiran CRLF, seperti keluaran Excel', () => {
    const csv = '﻿' + JUDUL + '\r\n;Budi Santoso;budi@x.id;;;;;;2024-01-15;;;9000000;;;\r\n';
    const { baris, galat } = uraikan(csv);
    assert.equal(galat, null);
    assert.equal(baris.length, 1);
    assert.equal(baris[0].nilai['Nama Lengkap'], 'Budi Santoso');
  });

  test('mengenali berkas berpemisah koma', () => {
    const judul = JUDUL.replace(/;/g, ',');
    const { baris, galat } = uraikan(`${judul}\n,Budi Santoso,budi@x.id,,,,,,2024-01-15,,,9000000,,,`);
    assert.equal(galat, null);
    assert.equal(baris[0].nilai['Surel'], 'budi@x.id');
  });

  test('menghormati tanda kutip di sekitar nilai berisi pemisah', () => {
    const csv = `${JUDUL}\n;"Santoso, Budi";budi@x.id;;;;;;2024-01-15;;;9000000;;;`;
    const { baris } = uraikan(csv);
    assert.equal(baris[0].nilai['Nama Lengkap'], 'Santoso, Budi');
  });

  test('menolak berkas tanpa kolom wajib, dan menyebut mana yang hilang', () => {
    const { galat } = uraikan('Nama Lengkap;Surel\nBudi;budi@x.id');
    assert.match(galat ?? '', /Tanggal Bergabung/);
    assert.match(galat ?? '', /Gaji Pokok/);
  });

  test('nomor baris yang dilaporkan cocok dengan nomor baris di Excel', () => {
    // Pemakainya membaca galat sambil menatap berkasnya. Nomor yang meleset
    // satu membuatnya menyunting baris yang salah.
    const csv = `${JUDUL}\n;Ali;a@x.id;;;;;;2024-01-15;;;1;;;\n;Budi;b@x.id;;;;;;2024-01-15;;;1;;;`;
    const { baris } = uraikan(csv);
    assert.deepEqual(baris.map((b) => b.nomor), [2, 3]);
  });
});

describe('Memeriksa baris', () => {
  test('baris baru yang sah menjadi rencana "buat"', () => {
    const { rencana, galat } = jalankan(
      `${JUDUL}\n;Budi Santoso;budi@x.id;0811;;;Teknologi;Backend Engineer;16/05/2024;kontrak;aktif;Rp 9.000.000;K/1;BCA;123456`,
    );
    assert.deepEqual(galat, []);
    assert.equal(rencana.length, 1);
    const r = rencana[0];
    assert.equal(r.tindakan, 'buat');
    assert.equal(r.data.baseSalary, 9_000_000);
    assert.equal(r.data.employmentType, 'CONTRACT');
    assert.equal(r.data.status, 'ACTIVE');
    assert.equal(r.data.ptkpStatus, 'K/1');
    assert.equal(r.data.departmentId, 'dep-1');
    assert.equal(r.data.positionId, 'pos-1');
    assert.equal(r.data.joinDate.toISOString(), '2024-05-16T00:00:00.000Z');
  });

  test('karyawan yang sudah ada diperbarui, bukan diduplikasi', () => {
    const { rencana } = jalankan(
      `${JUDUL}\nND-0001;Adit Baru;adit@nusantaradigital.id;;;;;;2020-11-13;;;60000000;;;`,
    );
    assert.equal(rencana[0].tindakan, 'perbarui');
    assert.equal(rencana[0].idAda, 'emp-1');
  });

  test('dicocokkan lewat surel bila nomor induknya tidak dikenal', () => {
    // Berkas dari sistem lain tidak memakai penomoran ND-xxxx. Tanpa
    // pencocokan lewat surel, impor semacam itu menggandakan seluruh karyawan.
    const { rencana } = jalankan(
      `${JUDUL}\nEMP-99;Adit;adit@nusantaradigital.id;;;;;;2020-11-13;;;60000000;;;`,
    );
    assert.equal(rencana[0].tindakan, 'perbarui');
    assert.equal(rencana[0].idAda, 'emp-1');
  });

  test('nomor induk dan surel yang menunjuk dua orang berbeda ditolak', () => {
    const ctx = konteks({ surelAda: new Map([['lain@x.id', 'emp-2']]) });
    const { rencana, galat } = jalankan(
      `${JUDUL}\nND-0001;Adit;lain@x.id;;;;;;2020-11-13;;;60000000;;;`,
      ctx,
    );
    assert.equal(rencana.length, 0);
    assert.match(galat[0].pesan, /dua karyawan berbeda/);
  });

  test('departemen yang belum ada ditolak, tidak dibuat diam-diam', () => {
    const { rencana, galat } = jalankan(
      `${JUDUL}\n;Budi;budi@x.id;;;;Teknologii;;2024-01-15;;;9000000;;;`,
    );
    assert.equal(rencana.length, 0);
    assert.equal(galat[0].kolom, 'Departemen');
    assert.match(galat[0].pesan, /Teknologii/);
  });

  test('surel kembar di dalam satu berkas tertangkap', () => {
    const { galat } = jalankan(
      `${JUDUL}\n;Ali;sama@x.id;;;;;;2024-01-15;;;1000000;;;\n;Budi;sama@x.id;;;;;;2024-01-15;;;1000000;;;`,
    );
    assert.equal(galat.length, 1);
    assert.match(galat[0].pesan, /baris 2/);
  });

  test('seluruh baris tetap diperiksa meski ada yang galat lebih dulu', () => {
    // Melaporkan satu galat per unggahan memaksa pemakainya mengulang
    // sebanyak jumlah kesalahan di berkasnya.
    const { galat } = jalankan(
      `${JUDUL}\n;Ali;bukan-surel;;;;;;2024-01-15;;;1000000;;;` +
      `\n;Budi;b@x.id;;;;;;bukan-tanggal;;;1000000;;;` +
      `\n;Cici;c@x.id;;;;;;2024-01-15;;;bukan-angka;;;`,
    );
    assert.deepEqual(galat.map((g) => g.nomor), [2, 3, 4]);
  });

  test('baris yang galat tidak ikut masuk rencana', () => {
    const { rencana, galat } = jalankan(
      `${JUDUL}\n;Ali;a@x.id;;;;;;2024-01-15;;;1000000;;;` +
      `\n;Budi;bukan-surel;;;;;;2024-01-15;;;1000000;;;`,
    );
    assert.equal(galat.length, 1);
    assert.equal(rencana.length, 1);
    assert.equal(rencana[0].surel, 'a@x.id');
  });

  test('kolom pilihan yang kosong menjadi null, bukan string kosong', () => {
    const { rencana } = jalankan(`${JUDUL}\n;Budi;budi@x.id;;;;;;2024-01-15;;;9000000;;;`);
    assert.equal(rencana[0].data.phone, null);
    assert.equal(rencana[0].data.bankName, null);
    assert.equal(rencana[0].data.npwp, null);
  });

  test('nilai bawaan dipakai saat kolomnya dikosongkan', () => {
    const { rencana } = jalankan(`${JUDUL}\n;Budi;budi@x.id;;;;;;2024-01-15;;;9000000;;;`);
    assert.equal(rencana[0].data.employmentType, 'PERMANENT');
    assert.equal(rencana[0].data.status, 'ACTIVE');
    assert.equal(rencana[0].data.ptkpStatus, 'TK/0');
  });

  test('surel disimpan dalam huruf kecil karena dipakai untuk masuk', () => {
    const { rencana } = jalankan(`${JUDUL}\n;Budi;BUDI@X.ID;;;;;;2024-01-15;;;9000000;;;`);
    assert.equal(rencana[0].data.email, 'budi@x.id');
  });

  test('gaji negatif ditolak', () => {
    const { galat } = jalankan(`${JUDUL}\n;Budi;budi@x.id;;;;;;2024-01-15;;;-5000000;;;`);
    assert.equal(galat[0].kolom, 'Gaji Pokok');
  });
});
