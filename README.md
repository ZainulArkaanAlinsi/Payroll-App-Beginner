# Payroll — Zainul Arkaan

Repositori ini memuat dua aplikasi penggajian: yang aktif dan pendahulunya.

## [`payroll-next/`](payroll-next) — Racik

**Aplikasi yang aktif dikembangkan.** Penulisan ulang penuh dengan Next.js 15,
TypeScript, Prisma, dan Three.js. Perhitungan PPh 21 metode TER, iuran BPJS lima
program, lembur sesuai Kepmenaker, slip gaji siap cetak, dan portal mandiri
karyawan.

```bash
cd payroll-next
npm install
npm run setup
npm run dev
```

Selengkapnya di [`payroll-next/README.md`](payroll-next/README.md), termasuk akun
demo dan penjelasan mesin perhitungannya.

## [`legacy/`](legacy) — versi Laravel

Versi pertama aplikasi ini: Laravel 12 + Livewire + Flux + MySQL. Disimpan sebagai
arsip, tidak lagi dikembangkan. Perlu PHP 8.2, Composer, dan MySQL untuk
menjalankannya.

Alur kerja GitHub Actions milik versi ini ikut pindah ke `legacy/.github/`, jadi
tidak lagi berjalan otomatis.
