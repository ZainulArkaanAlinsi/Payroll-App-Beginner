import { test, describe, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../src/app/api/cron/reset-demo/route';

/**
 * Penjaga rute pengaturan ulang demo.
 *
 * Rute ini menghapus seluruh isi basis data sebelum mengisinya kembali. Racik
 * dimaksudkan untuk ditempatkan perusahaan lain, dan penempatan itu berisi
 * catatan penggajian sungguhan — kalau rute ini terbuka, satu panggilan
 * terjadwal akan menghapusnya.
 *
 * Karena itu penjaganya diuji, bukan dipercaya. Uji di bawah tidak pernah
 * memanggil jalur yang berhasil: yang perlu dibuktikan justru bahwa jalur itu
 * tidak bisa dicapai tanpa kedua kunci yang disetel dengan sengaja.
 */

const asli = { DEMO_RESET: process.env.DEMO_RESET, CRON_SECRET: process.env.CRON_SECRET };

const minta = (auth?: string) =>
  new Request('http://uji.local/api/cron/reset-demo', {
    headers: auth ? { authorization: auth } : {},
  });

function setel(env: { DEMO_RESET?: string; CRON_SECRET?: string }) {
  delete process.env.DEMO_RESET;
  delete process.env.CRON_SECRET;
  Object.assign(process.env, env);
}

beforeEach(() => setel({}));

after(() => {
  // kembalikan keadaan semula supaya berkas uji lain tidak terpengaruh
  setel({});
  if (asli.DEMO_RESET) process.env.DEMO_RESET = asli.DEMO_RESET;
  if (asli.CRON_SECRET) process.env.CRON_SECRET = asli.CRON_SECRET;
});

describe('Rute pengaturan ulang demo tertutup secara bawaan', () => {
  test('tanpa setelan apa pun, rutenya seolah tidak ada', async () => {
    const res = await GET(minta());
    assert.equal(res.status, 404, 'penempatan biasa tidak boleh bisa menjangkaunya');
  });

  test('menjawab 404, bukan 403 — keberadaannya pun tidak diakui', async () => {
    // 403 memberi tahu bahwa rutenya ada dan hanya perlu kunci yang tepat.
    const res = await GET(minta('Bearer apa pun'));
    assert.equal(res.status, 404);
  });

  test('DEMO_RESET saja tidak cukup', async () => {
    setel({ DEMO_RESET: '1' });
    assert.equal((await GET(minta('Bearer apa pun'))).status, 404);
  });

  test('CRON_SECRET saja tidak cukup', async () => {
    setel({ CRON_SECRET: 'rahasia' });
    assert.equal((await GET(minta('Bearer rahasia'))).status, 404);
  });

  test('DEMO_RESET selain "1" tetap menutup rute', async () => {
    for (const nilai of ['0', 'true', 'ya', '']) {
      setel({ DEMO_RESET: nilai, CRON_SECRET: 'rahasia' });
      assert.equal(
        (await GET(minta('Bearer rahasia'))).status,
        404,
        `DEMO_RESET="${nilai}" seharusnya tidak menyalakan rute`,
      );
    }
  });
});

describe('Kunci diperiksa, bukan sekadar ada', () => {
  beforeEach(() => setel({ DEMO_RESET: '1', CRON_SECRET: 'rahasia-panjang' }));

  test('tanpa header Authorization ditolak', async () => {
    assert.equal((await GET(minta())).status, 401);
  });

  test('kunci keliru ditolak', async () => {
    assert.equal((await GET(minta('Bearer keliru'))).status, 401);
  });

  test('kunci benar tanpa awalan Bearer ditolak', async () => {
    assert.equal((await GET(minta('rahasia-panjang'))).status, 401);
  });

  test('kunci yang hanya berawalan sama ditolak', async () => {
    // Perbandingan harus utuh, bukan sekadar memeriksa awalannya.
    assert.equal((await GET(minta('Bearer rahasia'))).status, 401);
  });
});
