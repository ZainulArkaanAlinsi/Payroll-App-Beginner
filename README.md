# Racik — Payroll yang bisa diracik sendiri

**Demo langsung: <https://payroll-app-beginner.vercel.app>**
Masuk dengan `admin@racik.id` / `password123`.

Repositori ini memuat tiga bagian:

| Folder           | Isi                                                                 |
| ---------------- | ------------------------------------------------------------------- |
| `payroll-next/`  | aplikasi web untuk HR — mesin penggajian, Racik, laporan             |
| `payroll-mobile/`| aplikasi ponsel untuk karyawan — absen, slip gaji, cuti, lembur      |
| `legacy/`        | versi Laravel pendahulunya, disimpan sebagai riwayat                 |

Web dan ponsel berbagi satu mesin perhitungan dan satu berkas aturan layanan
mandiri, jadi pengajuan lewat ponsel tunduk pada batasan yang sama dengan web.

## Cara menjalankan

Butuh Node.js 18.18 atau lebih baru. Tidak perlu menyiapkan basis data — memakai SQLite.

```bash
npm run setup    # sekali saja: pasang dependensi, buat .env, buat tabel, isi data demo
npm run dev      # jalankan
```

Bisa dijalankan dari akar repositori ini maupun dari dalam `payroll-next/`.

Alamatnya muncul di terminal. Biasanya <http://localhost:3000>, tetapi bila port
itu sedang dipakai program lain, Next.js otomatis memilih port berikutnya —
**baca baris `Local:` di terminal**, jangan berasumsi 3000.

### Akun demo

Kata sandi untuk semua akun: `password123`

| Peran         | Surel                                       | Akses                                     |
| ------------- | ------------------------------------------- | ----------------------------------------- |
| Administrator | `admin@racik.id`                            | seluruh modul, pengaturan, jejak audit    |
| HRD           | `larasati.widyaningrum@nusantaradigital.id` | kepegawaian, proses gaji, laporan         |
| Karyawan      | `bagas.setiawan@nusantaradigital.id`        | portal mandiri: absen, slip, cuti, lembur |

### Perintah lain

```bash
npm run build     # build produksi
npm start         # jalankan hasil build
npm test          # 223 uji
npm run periksa   # periksa keutuhan data
npm run db:reset  # kosongkan lalu isi ulang data demo
npm run db:seed   # isi ulang data demo saja
```

### Aplikasi ponsel

Portal karyawan berjalan terpisah dan menghubungi API aplikasi web. Jalankan
server webnya lebih dulu, lalu:

```bash
cd payroll-mobile
npm install
npm start        # pindai kode QR dengan Expo Go, atau tekan w untuk peramban
```

Perangkat asli tidak mengenal `localhost` milik komputer Anda — isi
`EXPO_PUBLIC_API_URL` dengan alamat IP jaringan lokal. Rinciannya di
[`payroll-mobile/README.md`](payroll-mobile/README.md).

### Kalau gagal jalan

| Gejala                                   | Sebabnya                                                     |
| ---------------------------------------- | ------------------------------------------------------------ |
| `Could not read package.json`             | Berada di folder yang salah — pindah ke akar repo atau `payroll-next/` |
| `Port 3000 is in use`                     | Bukan galat. Next.js pindah ke port lain; lihat baris `Local:` |
| `AUTH_SECRET wajib diisi`                 | Jalankan `npm run setup` dulu — berkas `.env` belum dibuat     |
| `Can't reach database`                    | Jalankan `npm run setup`, atau `npm run db:reset`              |

---

## [`payroll-next/`](payroll-next) — Racik

**Aplikasi yang aktif dikembangkan.** Next.js 15, TypeScript, Prisma, Three.js.
Perhitungan PPh 21 metode TER, iuran BPJS lima program, lembur sesuai
Kepmenaker, slip gaji siap cetak, dan portal mandiri karyawan.

Pembedanya: **HR meracik sendiri** rumus gaji, aturan denda per divisi, alur
persetujuan, susunan slip, dan format berkas transfer bank — tanpa menyentuh
kode. Selengkapnya di [`payroll-next/README.md`](payroll-next/README.md).

## [`legacy/`](legacy) — versi Laravel

Versi pertama aplikasi ini: Laravel 12 + Livewire + Flux + MySQL. Disimpan
sebagai arsip, tidak lagi dikembangkan. Perlu PHP 8.2, Composer, dan MySQL
untuk menjalankannya. Alur kerja GitHub Actions miliknya ikut pindah ke
`legacy/.github/`, jadi tidak lagi berjalan otomatis.
