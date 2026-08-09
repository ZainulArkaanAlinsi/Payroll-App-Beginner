import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../src/app/api/health/route';
import { prisma } from '../src/lib/prisma';
import { siapkan, tutup } from './helpers/bekal';

/**
 * Pemeriksaan kesehatan.
 *
 * Yang diuji di sini bukan jalur bahagianya — itu bagian yang mudah. Yang
 * penting adalah rute ini menjawab dengan kode status yang benar saat rusak,
 * karena pemantau membaca kode status dan mengabaikan isi jawaban. Rute
 * kesehatan yang menjawab 200 sambil mengatakan "tidak sehat" di dalam badan
 * jawaban tidak akan pernah membangunkan siapa pun.
 *
 * Diuji juga bahwa ia tidak membocorkan apa pun: pesan galat Prisma memuat
 * alamat host dan nama basis data, sedangkan rute ini terbuka untuk umum.
 */

const baca = async (res: Response) => ({
  status: res.status,
  body: (await res.json()) as { ok: boolean; error?: string; data?: Record<string, unknown> },
  teks: '',
});

before(async () => {
  await siapkan();
});

after(tutup);

describe('Saat sehat', () => {
  test('menjawab 200 dan melaporkan jumlah isinya', async () => {
    const { status, body } = await baca(await GET());
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.data?.basisData, 'tersambung');
    assert.equal(body.data?.berisi, true);
    assert.ok((body.data?.karyawan as number) > 0);
  });

  test('menyertakan lama jawab, untuk melihat basis data yang melambat', async () => {
    const { body } = await baca(await GET());
    assert.equal(typeof body.data?.msJawab, 'number');
  });

  test('melarang penyinggahan', async () => {
    // Jawaban yang disinggahi membuat pemantau melihat keadaan lama dan
    // melaporkan sehat lama setelah aplikasinya berhenti bekerja.
    const res = await GET();
    assert.match(res.headers.get('Cache-Control') ?? '', /no-store/);
  });
});

describe('Saat basis data terjangkau tetapi kosong', () => {
  test('menjawab 503, bukan 200', async () => {
    // Basis data kosong berarti tidak ada seorang pun bisa masuk. Bagi
    // pemakainya itu sama saja dengan mati, jadi harus dilaporkan tidak sehat.
    await prisma.payrollItem.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.leaveRequest.deleteMany();
    await prisma.overtime.deleteMany();
    await prisma.employeeComponent.deleteMany();
    await prisma.employee.deleteMany();

    const { status, body } = await baca(await GET());
    assert.equal(status, 503, 'basis data kosong harus dilaporkan tidak sehat');
    assert.equal(body.data?.berisi, false);

    await siapkan();
  });
});

describe('Saat basis data tidak terjangkau', () => {
  /*
   * Basis data uji selalu hidup, sehingga blok penanganan galat tidak akan
   * pernah tersentuh dengan sendirinya — dan cabang itulah yang justru paling
   * penting. Kegagalannya ditiru dengan membuat kueri melempar, lalu
   * dikembalikan seperti semula.
   */
  const asli = prisma.employee.count.bind(prisma.employee);

  const gagalkan = () => {
    (prisma.employee as { count: unknown }).count = async () => {
      throw new Error(
        "Can't reach database server at `ep-cold-unit.neon.tech:5432`. " +
          'password authentication failed for user "neondb_owner"',
      );
    };
  };
  const pulihkan = () => {
    (prisma.employee as { count: unknown }).count = asli;
  };

  test('menjawab 503, bukan 200', async () => {
    gagalkan();
    try {
      const { status, body } = await baca(await GET());
      assert.equal(status, 503, 'pemantau membaca kode status, bukan isi jawaban');
      assert.equal(body.ok, false);
      assert.equal(body.data?.basisData, 'gagal');
    } finally {
      pulihkan();
    }
  });

  test('pesan galat mentah tidak ikut terkirim', async () => {
    gagalkan();
    try {
      const teks = JSON.stringify((await (await GET()).json()));
      for (const bocor of ['neon.tech', 'neondb_owner', 'password authentication', '5432']) {
        assert.ok(!teks.includes(bocor), `bocor ke pemanggil: ${bocor}`);
      }
    } finally {
      pulihkan();
    }
  });

  test('tetap melarang penyinggahan saat gagal', async () => {
    gagalkan();
    try {
      const res = await GET();
      assert.match(res.headers.get('Cache-Control') ?? '', /no-store/);
    } finally {
      pulihkan();
    }
  });
});

describe('Tidak membocorkan apa pun', () => {
  test('jawaban tidak memuat alamat, nama pengguna, atau sandi', async () => {
    const res = await GET();
    const teks = JSON.stringify(await res.json());

    for (const bocor of ['neon.tech', 'neondb', 'postgres://', 'postgresql://', 'password', 'file:']) {
      assert.ok(!teks.toLowerCase().includes(bocor.toLowerCase()), `bocor: ${bocor}`);
    }
  });

  test('tidak memuat jejak tumpukan maupun pesan Prisma mentah', async () => {
    const res = await GET();
    const teks = JSON.stringify(await res.json());
    assert.ok(!/PrismaClient|at async|\bstack\b/i.test(teks));
  });
});
