import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { POST as masuk } from '../src/app/api/mobile/login/route';
import { GET as saya } from '../src/app/api/mobile/me/route';
import { GET as daftarSlip } from '../src/app/api/mobile/payslips/route';
import { GET as rincianSlip } from '../src/app/api/mobile/payslips/[id]/route';
import { GET as daftarCuti, POST as kirimCuti } from '../src/app/api/mobile/leave/route';
import { GET as daftarLembur, POST as kirimLembur } from '../src/app/api/mobile/overtime/route';
import { GET as riwayatHadir } from '../src/app/api/mobile/attendance/route';
import { POST as absenRute } from '../src/app/api/mobile/attendance/clock/route';
import { issueMobileToken } from '../src/lib/mobile-auth';
import { baca, permintaan, SANDI, siapkan, tutup, type Bekal } from './helpers/bekal';

/**
 * Uji lapisan HTTP milik aplikasi ponsel.
 *
 * Penangan rutenya dipanggil langsung, tanpa menjalankan server. Yang diuji di
 * sini bukan lagi aturan bisnisnya — itu urusan self-service.test.ts —
 * melainkan hal yang hanya ada di lapisan ini: siapa yang boleh masuk, siapa
 * yang boleh melihat data siapa, dan apa yang terjadi pada masukan cacat.
 *
 * Yang paling penting di antaranya adalah batas kepemilikan data. Id slip gaji
 * memang sulit ditebak, tetapi "sulit ditebak" bukan pengendalian akses.
 */

let b: Bekal;
let token: string;

const params = (id: string) => ({ params: Promise.resolve({ id }) });

before(async () => {
  b = await siapkan();
  const res = await masuk(permintaan('/login', { body: { email: b.aditEmail, password: SANDI } }));
  const j = await baca(res);
  token = (j.data as { token: string }).token;
});

after(tutup);

describe('Masuk', () => {
  test('kredensial benar mengembalikan token dan identitas', async () => {
    const j = await baca(await masuk(permintaan('/login', { body: { email: b.aditEmail, password: SANDI } })));
    assert.equal(j.status, 200);
    const d = j.data as { token: string; user: { email: string; employeeId: string } };
    assert.ok(d.token.split('.').length === 3, 'harus berupa JWT');
    assert.equal(d.user.email, b.aditEmail);
    assert.equal(d.user.employeeId, b.aditId);
  });

  test('surel tidak dikenal dan sandi salah memberi pesan yang sama', async () => {
    // Membedakan keduanya memberi tahu penebak bahwa sebuah surel terdaftar.
    const a = await baca(await masuk(permintaan('/login', { body: { email: 'tidakada@uji.id', password: SANDI } })));
    const c = await baca(await masuk(permintaan('/login', { body: { email: b.aditEmail, password: 'salah' } })));
    assert.equal(a.status, 401);
    assert.equal(c.status, 401);
    assert.equal(a.error, c.error);
  });

  test('akun yang dinonaktifkan tidak bisa masuk', async () => {
    const j = await baca(await masuk(permintaan('/login', { body: { email: 'mati@uji.id', password: SANDI } })));
    assert.equal(j.status, 401);
  });

  test('surel tidak peka huruf besar-kecil', async () => {
    const j = await baca(await masuk(permintaan('/login', { body: { email: 'ADIT@UJI.ID', password: SANDI } })));
    assert.equal(j.status, 200);
  });

  test('isian kosong ditolak sebelum menyentuh basis data', async () => {
    for (const body of [{}, { email: b.aditEmail }, { password: SANDI }]) {
      const j = await baca(await masuk(permintaan('/login', { body })));
      assert.equal(j.status, 400, JSON.stringify(body));
    }
  });

  test('sandi tidak pernah ikut terkirim balik', async () => {
    const res = await masuk(permintaan('/login', { body: { email: b.aditEmail, password: SANDI } }));
    const teks = JSON.stringify(await res.json());
    assert.ok(!teks.includes(SANDI), 'sandi mentah bocor di jawaban');
    assert.ok(!teks.includes('$2b$') && !teks.includes('$2a$'), 'hash sandi bocor di jawaban');
  });
});

describe('Penjagaan token', () => {
  const tanpaToken: [string, (r: Request) => Promise<Response>][] = [
    ['/me', saya],
    ['/payslips', daftarSlip],
    ['/leave', daftarCuti],
    ['/overtime', daftarLembur],
    ['/attendance', riwayatHadir],
  ];

  for (const [jalur, penangan] of tanpaToken) {
    test(`${jalur} menolak permintaan tanpa token`, async () => {
      const j = await baca(await penangan(permintaan(jalur)));
      assert.equal(j.status, 401);
      assert.equal(j.ok, false);
    });
  }

  test('token asal-asalan ditolak', async () => {
    const j = await baca(await saya(permintaan('/me', { token: 'bukan.token.sungguhan' })));
    assert.equal(j.status, 401);
  });

  test('token yang ditandatangani kunci lain ditolak', async () => {
    // Tanda tangan JWT hanya berguna bila benar-benar diperiksa.
    const palsu = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ4IiwiYXVkIjoicmFjaWstbW9iaWxlIn0.tandatanganpalsu';
    const j = await baca(await saya(permintaan('/me', { token: palsu })));
    assert.equal(j.status, 401);
  });

  test('token tanpa audiens ponsel ditolak', async () => {
    // Cookie sesi web tidak beraudiens. Menerimanya di sini akan menghapus
    // pemisahan antara sesi web tujuh hari dan token ponsel tiga puluh hari.
    const { SignJWT } = await import('jose');
    const kunci = new TextEncoder().encode(process.env.AUTH_SECRET!);
    const web = await new SignJWT({ userId: b.aditUserId, employeeId: b.aditId, role: 'EMPLOYEE' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(kunci);

    const j = await baca(await saya(permintaan('/me', { token: web })));
    assert.equal(j.status, 401, 'token web tidak boleh berlaku sebagai token ponsel');
  });

  test('akun tanpa data karyawan ditolak dengan 403, bukan 401', async () => {
    // Bedanya penting bagi klien: 401 berarti masuk lagi, 403 berarti masuk
    // lagi pun tidak akan menolong.
    const tokenHr = await issueMobileToken({
      userId: 'x', email: b.hrEmail, name: 'HR Uji', role: 'HR', employeeId: null, avatarHue: 160,
    });
    const j = await baca(await saya(permintaan('/me', { token: tokenHr })));
    assert.equal(j.status, 403);
  });
});

describe('Beranda', () => {
  test('mengirim seluruh isi layar beranda sekali jalan', async () => {
    const j = await baca(await saya(permintaan('/me', { token })));
    assert.equal(j.status, 200);
    const d = j.data as Record<string, unknown>;
    for (const kunci of ['profil', 'hariIni', 'kuotaCuti', 'slipTerakhir', 'tertunda', 'kehadiranBulanIni']) {
      assert.ok(kunci in d, `bagian ${kunci} hilang`);
    }
  });

  test('slip terakhir hanya dari periode yang sudah dibayarkan', async () => {
    const j = await baca(await saya(permintaan('/me', { token })));
    const d = j.data as { slipTerakhir: { id: string } | null };
    assert.equal(d.slipTerakhir?.id, b.slipDibayarId, 'periode draf tidak boleh muncul');
  });

  test('kuota cuti ikut terkirim', async () => {
    const j = await baca(await saya(permintaan('/me', { token })));
    const d = j.data as { kuotaCuti: { sisa: number } };
    assert.equal(d.kuotaCuti.sisa, 10);
  });
});

describe('Slip gaji dan batas kepemilikannya', () => {
  test('daftar hanya memuat slip yang sudah dibayarkan', async () => {
    const j = await baca(await daftarSlip(permintaan('/payslips', { token })));
    const d = j.data as { id: string }[];
    assert.equal(d.length, 1);
    assert.equal(d[0].id, b.slipDibayarId);
  });

  test('rincian slip sendiri bisa dibuka', async () => {
    const j = await baca(await rincianSlip(permintaan(`/payslips/${b.slipDibayarId}`, { token }), params(b.slipDibayarId)));
    assert.equal(j.status, 200);
    const d = j.data as { netPay: number; rincian: unknown[] };
    assert.equal(d.netPay, 10_000_000);
    assert.equal(d.rincian.length, 4, 'rincian JSON harus terurai, bukan dikirim sebagai teks');
  });

  test('slip milik karyawan lain tidak bisa dibuka', async () => {
    const j = await baca(await rincianSlip(permintaan(`/payslips/${b.slipBinaId}`, { token }), params(b.slipBinaId)));
    assert.equal(j.status, 404, 'id yang sulit ditebak bukan pengendalian akses');
    assert.equal(j.ok, false);
  });

  test('slip periode yang belum dibayarkan tidak bisa dibuka', async () => {
    const j = await baca(await rincianSlip(permintaan(`/payslips/${b.slipDraftId}`, { token }), params(b.slipDraftId)));
    assert.equal(j.status, 403);
  });

  test('id yang tidak ada memberi 404, bukan galat server', async () => {
    const j = await baca(await rincianSlip(permintaan('/payslips/tidakada', { token }), params('tidakada')));
    assert.equal(j.status, 404);
  });

  test('kolom breakdown mentah tidak ikut terkirim', async () => {
    const j = await baca(await rincianSlip(permintaan(`/payslips/${b.slipDibayarId}`, { token }), params(b.slipDibayarId)));
    assert.ok(!('breakdown' in (j.data as object)), 'jangan kirim dua bentuk data yang sama');
  });
});

describe('Kehadiran', () => {
  test('bulan tidak sah tidak menjatuhkan rute', async () => {
    const j = await baca(await riwayatHadir(permintaan('/attendance?month=bukan-bulan', { token })));
    assert.equal(j.status, 200);
    const d = j.data as { hari: unknown[] };
    assert.equal(d.hari.length, 0);
  });

  test('absen lewat rute mengembalikan keadaan terbaru', async () => {
    const j = await baca(await absenRute(permintaan('/attendance/clock', { token, body: { kind: 'IN' } })));
    assert.equal(j.status, 200);
    const d = j.data as { pesan: string; hariIni: { sudahMasuk: boolean } };
    assert.equal(d.hariIni.sudahMasuk, true, 'layar tidak perlu memuat ulang untuk tahu hasilnya');
  });

  test('jenis absen selain IN atau OUT ditolak', async () => {
    for (const kind of ['MASUK', '', null, 123]) {
      const j = await baca(await absenRute(permintaan('/attendance/clock', { token, body: { kind } })));
      assert.equal(j.status, 400, `kind=${JSON.stringify(kind)}`);
    }
  });

  test('aturan absen ganda tetap berlaku lewat rute', async () => {
    const j = await baca(await absenRute(permintaan('/attendance/clock', { token, body: { kind: 'IN' } })));
    assert.equal(j.status, 400);
    assert.match(j.error ?? '', /sudah absen masuk/);
  });
});

describe('Cuti dan lembur lewat rute', () => {
  test('pengajuan cuti tersimpan', async () => {
    const j = await baca(await kirimCuti(permintaan('/leave', {
      token,
      body: { type: 'ANNUAL', startDate: '2026-11-02', endDate: '2026-11-04', reason: 'Keperluan keluarga' },
    })));
    assert.equal(j.status, 200);
  });

  test('rute memakai identitas token, bukan employeeId dari badan permintaan', async () => {
    // Bila employeeId dipercaya apa adanya, siapa pun bisa mengajukan atas
    // nama orang lain hanya dengan mengganti satu nilai di badan permintaan.
    //
    // Memeriksa "Bina tidak punya pengajuan" saja tidak cukup: lapisan layanan
    // mandiri juga menolak hal itu, sehingga uji tetap hijau meski rutenya
    // meneruskan employeeId asing. Maka yang diperiksa adalah rutenya
    // mengabaikan nilai itu dan tetap membuat pengajuan atas nama pemilik
    // token — hasil yang hanya mungkin bila nilainya benar-benar tidak dipakai.
    const j = await baca(await kirimCuti(permintaan('/leave', {
      token,
      body: {
        employeeId: b.binaId,
        type: 'SICK', startDate: '2027-03-01', endDate: '2027-03-02',
        reason: 'Mencoba mengatasnamakan orang lain',
      },
    })));
    assert.equal(j.status, 200, 'rute seharusnya mengabaikan employeeId asing, bukan gagal karenanya');

    const { prisma } = await import('../src/lib/prisma');
    const milikBina = await prisma.leaveRequest.count({ where: { employeeId: b.binaId } });
    const milikAdit = await prisma.leaveRequest.count({
      where: { employeeId: b.aditId, reason: 'Mencoba mengatasnamakan orang lain' },
    });
    assert.equal(milikBina, 0, 'employeeId dari badan permintaan tidak boleh dipercaya');
    assert.equal(milikAdit, 1, 'pengajuan harus tercatat atas nama pemilik token');
  });

  test('aturan kuota tetap berlaku lewat rute', async () => {
    const j = await baca(await kirimCuti(permintaan('/leave', {
      token,
      body: { type: 'ANNUAL', startDate: '2026-12-01', endDate: '2026-12-31', reason: 'Melebihi kuota' },
    })));
    assert.equal(j.status, 400);
    assert.match(j.error ?? '', /kuota/);
  });

  test('badan permintaan yang bukan JSON ditolak rapi', async () => {
    const req = new Request('http://uji.local/api/mobile/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: 'ini bukan json',
    });
    const j = await baca(await kirimCuti(req));
    assert.equal(j.status, 400);
  });

  test('perkiraan lembur dihitung tanpa menyimpan apa pun', async () => {
    const sebelum = await (await import('../src/lib/prisma')).prisma.overtime.count();
    const j = await baca(await kirimLembur(permintaan('/overtime', {
      token, body: { date: '2026-11-10', hours: 3, perkiraanSaja: true },
    })));
    assert.equal(j.status, 200);
    const d = j.data as { perkiraan: number };
    assert.ok(d.perkiraan > 0, 'perkiraan harus berupa rupiah yang masuk akal');

    const sesudah = await (await import('../src/lib/prisma')).prisma.overtime.count();
    assert.equal(sesudah, sebelum, 'melihat perkiraan tidak boleh membuat pengajuan');
  });

  test('perkiraan hari libur lebih besar daripada hari kerja', async () => {
    // Kepmenaker 102/2004: hari libur dikali dua sejak jam pertama, hari kerja
    // baru satu setengah.
    const kerja = await baca(await kirimLembur(permintaan('/overtime', {
      token, body: { date: '2026-11-10', hours: 3, perkiraanSaja: true },
    })));
    const libur = await baca(await kirimLembur(permintaan('/overtime', {
      token, body: { date: '2026-11-14', hours: 3, perkiraanSaja: true },
    })));
    const a = (kerja.data as { perkiraan: number }).perkiraan;
    const c = (libur.data as { perkiraan: number }).perkiraan;
    assert.ok(c > a, `libur ${c} harus lebih besar dari hari kerja ${a}`);
  });
});

describe('Bentuk jawaban', () => {
  test('gagal maupun berhasil memakai bentuk yang sama', async () => {
    const berhasil = await baca(await saya(permintaan('/me', { token })));
    const gagal = await baca(await saya(permintaan('/me')));
    assert.equal(berhasil.ok, true);
    assert.equal(gagal.ok, false);
    assert.ok('data' in berhasil && 'error' in gagal, 'klien cukup satu cara membaca hasil');
  });

  test('header CORS terpasang agar Expo Web bisa memanggil', async () => {
    const res = await saya(permintaan('/me', { token }));
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
    assert.ok(res.headers.get('Access-Control-Allow-Headers')?.includes('Authorization'));
  });

  test('jawaban gagal pun membawa header CORS', async () => {
    // Tanpa ini, kegagalan tampil di peramban sebagai galat jaringan tanpa
    // pesan — persis saat pesannya paling dibutuhkan.
    const res = await saya(permintaan('/me'));
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
  });
});
