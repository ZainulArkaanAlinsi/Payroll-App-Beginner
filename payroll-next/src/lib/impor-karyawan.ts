import { dariYMD } from './waktu';

/**
 * Impor karyawan dari CSV.
 *
 * Kolomnya sengaja sama persis dengan berkas ekspor karyawan, sehingga alurnya
 * bisa berputar: ekspor → sunting di Excel → impor kembali. Perusahaan yang
 * baru memasang sistem ini hampir selalu sudah memegang daftar karyawannya
 * dalam bentuk spreadsheet, dan mengetik ulang delapan puluh orang adalah
 * alasan paling umum sebuah pemasangan berhenti di hari pertama.
 *
 * Berkas ini murni perhitungan — tidak menyentuh basis data sama sekali.
 * Pemeriksaannya dijalankan lebih dulu terhadap seluruh berkas, dan hasilnya
 * ditampilkan sebagai rencana sebelum ada satu baris pun yang disimpan. Impor
 * gaji yang langsung menulis tanpa ditinjau adalah cara tercepat mengubah satu
 * salah ketik menjadi delapan puluh gaji yang salah.
 */

/** Kolom yang dikenali, persis seperti judul pada berkas ekspor. */
export const KOLOM = [
  'Nomor Induk', 'Nama Lengkap', 'Surel', 'Telepon', 'NIK', 'NPWP',
  'Departemen', 'Posisi', 'Tanggal Bergabung', 'Jenis Hubungan Kerja',
  'Status', 'Gaji Pokok', 'Status PTKP', 'Bank', 'Nomor Rekening',
] as const;

const WAJIB = ['Nama Lengkap', 'Surel', 'Tanggal Bergabung', 'Gaji Pokok'] as const;

/*
 * Nilai enum diterima dalam dua bentuk: kode apa adanya seperti pada berkas
 * ekspor, dan istilah Indonesia yang akan diketik orang saat menyunting di
 * Excel. Menolak "Karyawan tetap" karena bukan "PERMANENT" hanya memindahkan
 * pekerjaan penerjemahan ke pemakainya.
 */
const HUBUNGAN_KERJA: Record<string, string> = {
  PERMANENT: 'PERMANENT', TETAP: 'PERMANENT', 'KARYAWAN TETAP': 'PERMANENT',
  CONTRACT: 'CONTRACT', KONTRAK: 'CONTRACT', PKWT: 'CONTRACT',
  PROBATION: 'PROBATION', PERCOBAAN: 'PROBATION', 'MASA PERCOBAAN': 'PROBATION',
  INTERN: 'INTERN', MAGANG: 'INTERN',
};

const STATUS: Record<string, string> = {
  ACTIVE: 'ACTIVE', AKTIF: 'ACTIVE',
  ON_LEAVE: 'ON_LEAVE', CUTI: 'ON_LEAVE', 'CUTI PANJANG': 'ON_LEAVE',
  RESIGNED: 'RESIGNED', RESIGN: 'RESIGNED', 'MENGUNDURKAN DIRI': 'RESIGNED',
  TERMINATED: 'TERMINATED', PHK: 'TERMINATED', DIBERHENTIKAN: 'TERMINATED',
};

const PTKP = new Set(['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3']);

// ── penguraian berkas ──────────────────────────────────────────────

/**
 * Memilih pemisah kolom dengan menghitung kemunculannya di baris judul.
 *
 * Excel berbahasa Indonesia menulis ';' sementara berkas dari sistem lain
 * memakai ','. Menebaknya dari baris judul jauh lebih andal daripada meminta
 * pemakainya tahu berkasnya sendiri memakai yang mana.
 */
function pemisah(barisJudul: string): string {
  const titikKoma = (barisJudul.match(/;/g) ?? []).length;
  const koma = (barisJudul.match(/,/g) ?? []).length;
  return titikKoma >= koma ? ';' : ',';
}

/** Memecah satu baris CSV, menghormati tanda kutip dan kutip ganda di dalamnya. */
function pecah(baris: string, pisah: string): string[] {
  const keluar: string[] = [];
  let kini = '';
  let dalamKutip = false;

  for (let i = 0; i < baris.length; i++) {
    const c = baris[i];
    if (dalamKutip) {
      if (c === '"') {
        if (baris[i + 1] === '"') { kini += '"'; i++; }
        else dalamKutip = false;
      } else kini += c;
    } else if (c === '"') {
      dalamKutip = true;
    } else if (c === pisah) {
      keluar.push(kini); kini = '';
    } else {
      kini += c;
    }
  }
  keluar.push(kini);
  return keluar.map((s) => s.trim());
}

export interface BarisMentah {
  nomor: number; // nomor baris di berkas, sebagaimana dilihat pemakai di Excel
  nilai: Record<string, string>;
}

export function uraikan(teks: string): { baris: BarisMentah[]; galat: string | null } {
  // BOM UTF-8 ikut terbawa dari berkas yang ditulis Excel; bila tidak dibuang,
  // judul kolom pertama tidak akan pernah cocok.
  const bersih = teks.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const semua = bersih.split('\n').filter((b) => b.trim() !== '');
  if (semua.length === 0) return { baris: [], galat: 'Berkas kosong.' };

  const pisah = pemisah(semua[0]);
  const judul = pecah(semua[0], pisah);

  const hilang = WAJIB.filter((k) => !judul.includes(k));
  if (hilang.length) {
    return {
      baris: [],
      galat:
        `Kolom wajib tidak ditemukan: ${hilang.join(', ')}. ` +
        'Cara paling aman: unduh dulu berkas Ekspor CSV, sunting isinya, lalu unggah kembali.',
    };
  }

  const baris: BarisMentah[] = [];
  for (let i = 1; i < semua.length; i++) {
    const sel = pecah(semua[i], pisah);
    const nilai: Record<string, string> = {};
    judul.forEach((j, k) => { nilai[j] = sel[k] ?? ''; });
    baris.push({ nomor: i + 1, nilai });
  }
  return { baris, galat: null };
}

// ── pembacaan nilai ────────────────────────────────────────────────

/**
 * Membaca angka rupiah sebagaimana ditulis orang Indonesia.
 *
 * "Rp 52.000.000", "52.000.000", dan "52000000" semuanya berarti hal yang
 * sama. Titik di sini pemisah ribuan, bukan desimal — dan gaji pokok memang
 * bilangan bulat rupiah, sehingga pecahan justru menandakan salah ketik.
 */
export function bacaRupiah(teks: string): number | null {
  const s = teks.replace(/\s|Rp/gi, '').trim();
  if (s === '') return null;
  if (!/^-?[\d.,]+$/.test(s)) return null;

  // Titik dibuang sebagai pemisah ribuan; koma disisakan agar desimal —
  // yang tidak sah untuk gaji pokok — tertangkap sebagai galat, bukan
  // dibulatkan diam-diam.
  const angka = s.replace(/\./g, '');
  if (!/^-?\d+$/.test(angka)) return null;
  const n = Number(angka);
  return Number.isSafeInteger(n) ? n : null;
}

/**
 * Membaca tanggal dalam bentuk yang mungkin keluar dari Excel.
 *
 * Hasilnya ditambatkan ke tengah malam WIB lewat dariYMD, sama seperti seluruh
 * tanggal kalender lain di sistem ini, supaya tanggal bergabung tidak bergeser
 * satu hari tergantung zona waktu peladen.
 */
export function bacaTanggal(teks: string): Date | null {
  const s = teks.trim();
  if (s === '') return null;

  let y: number, b: number, h: number;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  const lokal = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s);

  if (iso) { [, y, b, h] = iso.map(Number) as [number, number, number, number]; }
  else if (lokal) {
    // Urutan hari-bulan-tahun, bukan bulan-hari: itu yang dipakai di Indonesia.
    const [, hh, bb, yy] = lokal.map(Number) as [number, number, number, number];
    y = yy; b = bb; h = hh;
  } else return null;

  if (b < 1 || b > 12 || h < 1 || h > 31) return null;
  const d = dariYMD(y, b, h);
  // Menangkap tanggal yang meluber, misalnya 31 Februari.
  if (d.getUTCMonth() + 1 !== b || d.getUTCDate() !== h) return null;
  return d;
}

// ── pemeriksaan ────────────────────────────────────────────────────

export interface KonteksImpor {
  /** employeeNo → id, untuk mengenali karyawan yang sudah ada. */
  nomorIndukAda: Map<string, string>;
  /** surel (huruf kecil) → id, karena surel dipakai untuk masuk. */
  surelAda: Map<string, string>;
  /** nama departemen (huruf kecil) → id. */
  departemen: Map<string, string>;
  /** judul posisi (huruf kecil) → id. */
  posisi: Map<string, string>;
}

export interface RencanaBaris {
  nomor: number;
  tindakan: 'buat' | 'perbarui';
  /** id karyawan yang akan diperbarui; kosong bila baris ini membuat baru. */
  idAda?: string;
  nama: string;
  surel: string;
  data: {
    fullName: string;
    email: string;
    phone: string | null;
    nik: string | null;
    npwp: string | null;
    departmentId: string | null;
    positionId: string | null;
    joinDate: Date;
    employmentType: string;
    status: string;
    baseSalary: number;
    ptkpStatus: string;
    bankName: string | null;
    bankAccount: string | null;
  };
  /** Hal yang perlu dilihat pemakai tetapi tidak menggagalkan baris. */
  catatan: string[];
}

export interface GalatBaris {
  nomor: number;
  kolom: string;
  pesan: string;
}

export interface HasilPeriksa {
  rencana: RencanaBaris[];
  galat: GalatBaris[];
}

/**
 * Memeriksa seluruh berkas dan menyusun rencananya.
 *
 * Seluruh baris diperiksa meskipun sudah ada yang galat — pemakainya perlu
 * melihat semua persoalannya sekaligus, bukan diberi satu galat per unggahan
 * lalu disuruh mencoba lagi delapan belas kali.
 */
export function periksa(baris: BarisMentah[], ctx: KonteksImpor): HasilPeriksa {
  const rencana: RencanaBaris[] = [];
  const galat: GalatBaris[] = [];

  // Berkas itu sendiri bisa memuat surel atau nomor induk kembar; ini
  // tertangkap hanya bila seluruh berkas dilihat sekaligus, bukan per baris.
  const surelDiBerkas = new Map<string, number>();
  const nomorDiBerkas = new Map<string, number>();

  for (const b of baris) {
    const ambil = (k: string) => (b.nilai[k] ?? '').trim();
    const kosongJadiNull = (k: string) => { const v = ambil(k); return v === '' ? null : v; };
    const catatan: string[] = [];
    let rusak = false;
    const tolak = (kolom: string, pesan: string) => { galat.push({ nomor: b.nomor, kolom, pesan }); rusak = true; };

    const nama = ambil('Nama Lengkap');
    if (nama.length < 3) tolak('Nama Lengkap', 'Nama minimal 3 karakter.');

    const surel = ambil('Surel').toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(surel)) tolak('Surel', 'Format surel tidak valid.');
    else if (surelDiBerkas.has(surel)) {
      tolak('Surel', `Surel kembar dengan baris ${surelDiBerkas.get(surel)} di berkas ini.`);
    } else surelDiBerkas.set(surel, b.nomor);

    const nomorInduk = ambil('Nomor Induk');
    if (nomorInduk) {
      if (nomorDiBerkas.has(nomorInduk)) {
        tolak('Nomor Induk', `Nomor induk kembar dengan baris ${nomorDiBerkas.get(nomorInduk)} di berkas ini.`);
      } else nomorDiBerkas.set(nomorInduk, b.nomor);
    }

    const gaji = bacaRupiah(ambil('Gaji Pokok'));
    if (gaji === null) tolak('Gaji Pokok', `"${ambil('Gaji Pokok')}" bukan angka rupiah yang bisa dibaca.`);
    else if (gaji < 0) tolak('Gaji Pokok', 'Gaji tidak boleh negatif.');

    const bergabung = bacaTanggal(ambil('Tanggal Bergabung'));
    if (!bergabung) {
      tolak('Tanggal Bergabung', `"${ambil('Tanggal Bergabung')}" bukan tanggal yang dikenali (pakai 2024-01-31 atau 31/01/2024).`);
    }

    const jenisTeks = ambil('Jenis Hubungan Kerja');
    const jenis = jenisTeks === '' ? 'PERMANENT' : HUBUNGAN_KERJA[jenisTeks.toUpperCase()];
    if (!jenis) tolak('Jenis Hubungan Kerja', `"${jenisTeks}" tidak dikenali. Pakai: tetap, kontrak, percobaan, atau magang.`);

    const statusTeks = ambil('Status');
    const status = statusTeks === '' ? 'ACTIVE' : STATUS[statusTeks.toUpperCase()];
    if (!status) tolak('Status', `"${statusTeks}" tidak dikenali. Pakai: aktif, cuti, resign, atau PHK.`);

    const ptkpTeks = ambil('Status PTKP');
    const ptkp = ptkpTeks === '' ? 'TK/0' : ptkpTeks.toUpperCase();
    if (!PTKP.has(ptkp)) tolak('Status PTKP', `"${ptkpTeks}" tidak dikenali. Pakai TK/0 sampai K/3.`);

    /*
     * Departemen dan posisi harus sudah ada. Membuatnya otomatis dari isi
     * berkas terasa membantu selama satu menit, lalu satu salah ketik
     * melahirkan departemen "Teknologii" berisi satu orang yang tidak akan
     * pernah disadari sampai laporan biaya per departemen terlihat ganjil.
     */
    const deptTeks = ambil('Departemen');
    let departmentId: string | null = null;
    if (deptTeks) {
      departmentId = ctx.departemen.get(deptTeks.toLowerCase()) ?? null;
      if (!departmentId) tolak('Departemen', `Departemen "${deptTeks}" belum ada. Buat dulu di halaman Organisasi.`);
    } else catatan.push('tanpa departemen');

    const posTeks = ambil('Posisi');
    let positionId: string | null = null;
    if (posTeks) {
      positionId = ctx.posisi.get(posTeks.toLowerCase()) ?? null;
      if (!positionId) tolak('Posisi', `Posisi "${posTeks}" belum ada. Buat dulu di halaman Organisasi.`);
    } else catatan.push('tanpa posisi');

    if (rusak) continue;

    /*
     * Pencocokan dengan data yang sudah ada: nomor induk lebih dulu, karena
     * itu tetap meskipun namanya berubah. Surel dipakai sebagai cadangan agar
     * berkas dari sistem lain — yang tidak memakai penomoran ini — tetap bisa
     * menemukan orangnya alih-alih membuat duplikat.
     */
    const idLewatNomor = nomorInduk ? ctx.nomorIndukAda.get(nomorInduk) : undefined;
    const idLewatSurel = ctx.surelAda.get(surel);

    if (idLewatNomor && idLewatSurel && idLewatNomor !== idLewatSurel) {
      galat.push({
        nomor: b.nomor,
        kolom: 'Surel',
        pesan: `Nomor induk ${nomorInduk} dan surel ${surel} menunjuk dua karyawan berbeda.`,
      });
      continue;
    }

    const idAda = idLewatNomor ?? idLewatSurel;
    if (!idAda && nomorInduk) catatan.push(`nomor induk ${nomorInduk} diabaikan, akan dibuatkan baru`);
    if (!idLewatNomor && idLewatSurel) catatan.push('dicocokkan lewat surel');

    rencana.push({
      nomor: b.nomor,
      tindakan: idAda ? 'perbarui' : 'buat',
      idAda,
      nama,
      surel,
      data: {
        fullName: nama,
        email: surel,
        phone: kosongJadiNull('Telepon'),
        nik: kosongJadiNull('NIK'),
        npwp: kosongJadiNull('NPWP'),
        departmentId,
        positionId,
        joinDate: bergabung!,
        employmentType: jenis,
        status,
        baseSalary: gaji!,
        ptkpStatus: ptkp,
        bankName: kosongJadiNull('Bank'),
        bankAccount: kosongJadiNull('Nomor Rekening'),
      },
      catatan,
    });
  }

  return { rencana, galat };
}
