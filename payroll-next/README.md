# Racik — Sistem Penggajian Modern

Platform penggajian untuk perusahaan Indonesia. Menyatukan kehadiran, lembur, cuti,
tunjangan, iuran BPJS, dan PPh 21 ke dalam satu proses yang bisa ditelusuri sampai
rupiah terakhir.

Dibangun sebagai proyek portofolio oleh **Zainul Arkaan**.

---

## Visi

> Setiap pekerja Indonesia menerima gaji yang benar, tepat waktu, dan bisa dimengerti.

Slip gaji seharusnya bukan dokumen yang diterima dengan pasrah. Ia adalah
pertanggungjawaban — dan pertanggungjawaban hanya bermakna kalau bisa dibaca oleh
orang yang menerimanya.

## Misi

1. **Menghapus kerja hitung manual.** PPh 21 metode TER, lima program BPJS, lembur
   Kepmenaker, dan potongan berjalan dalam satu proses. Tidak ada lagi spreadsheet
   berformula rapuh yang diwariskan antar staf.
2. **Membuat angka bisa ditelusuri.** Setiap rupiah pada slip gaji punya jejak: dari
   komponen mana, tarif berapa, dasar hukumnya apa.
3. **Menjaga kepatuhan tetap murah.** Tarif dan plafon disimpan sebagai konfigurasi,
   bukan ditanam di kode. Ketika regulasi berubah, cukup ubah satu halaman pengaturan.
4. **Memindahkan waktu HRD ke manusia.** Kehadiran, cuti, dan lembur mengalir otomatis
   ke perhitungan gaji.

---

## Menjalankan

Butuh Node.js 18.18 atau lebih baru. Tidak perlu menyiapkan basis data — memakai SQLite.

```bash
npm install
npm run setup     # generate Prisma client + buat skema + isi data demo
npm run dev       # http://localhost:3000
```

### Akun demo

Kata sandi untuk semua akun: `password123`

| Peran         | Surel                                          | Akses                                            |
| ------------- | ---------------------------------------------- | ------------------------------------------------ |
| Administrator | `admin@racik.id`                             | seluruh modul, pengaturan, jejak audit           |
| HRD           | `larasati.widyaningrum@nusantaradigital.id`    | kepegawaian, proses gaji, laporan                |
| Karyawan      | `bagas.setiawan@nusantaradigital.id`           | portal mandiri: absen, slip, cuti, lembur        |

### Perintah lain

```bash
npm run build      # build produksi
npm run db:reset   # kosongkan lalu isi ulang data demo
npm run db:seed    # isi ulang data demo saja
```

---

## Mesin perhitungan

Bagian ini yang membedakan Racik dari CRUD payroll biasa. Seluruhnya di
`src/lib/tax.ts` dan `src/lib/payroll-engine.ts`, terpisah dari lapisan tampilan
sehingga bisa diuji sendiri.

### PPh 21

- **Metode TER** (PP 58/2023) untuk masa Januari–November. Tiga kategori tarif
  (A, B, C) dipilih dari status PTKP karyawan, masing-masing 44 lapisan tarif atas
  penghasilan bruto bulanan.
- **Metode progresif** Pasal 17 UU HPP untuk masa Desember, menutup selisih setahun
  penuh setelah dikurangi biaya jabatan, iuran BPJS karyawan, dan PTKP.
- Karyawan **tanpa NPWP** dikenakan tarif 20% lebih tinggi (Pasal 21 ayat 5a UU PPh).
- Biaya jabatan 5% bruto dengan plafon Rp 500.000 per bulan.

### BPJS

| Program              | Karyawan | Perusahaan | Plafon upah    |
| -------------------- | -------- | ---------- | -------------- |
| Kesehatan            | 1%       | 4%         | Rp 12.000.000  |
| Jaminan Hari Tua     | 2%       | 3,7%       | tanpa plafon   |
| Jaminan Pensiun      | 1%       | 2%         | Rp 10.547.400  |
| JKK                  | —        | 0,24%      | tanpa plafon   |
| JKM                  | —        | 0,30%      | tanpa plafon   |

Premi Kesehatan, JKK, dan JKM yang dibayar perusahaan ikut menambah penghasilan
bruto kena pajak karyawan, sesuai ketentuan PPh 21. Semua angka di atas bisa diubah
dari halaman Pengaturan tanpa menyentuh kode.

### Lembur

Kepmenaker 102/2004, pola lima hari kerja. Upah sejam = 1/173 × upah sebulan.

- Hari kerja: jam pertama ×1,5 — jam berikutnya ×2
- Hari libur: jam 1–8 ×2 — jam ke-9 ×3 — jam ke-10 dan seterusnya ×4

Nilai rupiah dikunci saat pengajuan disetujui, memakai upah yang berlaku saat itu,
sehingga kenaikan gaji di kemudian hari tidak mengubah lembur yang lampau.

---

## Alur proses gaji

```
DRAFT  ──hitung──▶  CALCULATED  ──setujui──▶  APPROVED  ──bayar──▶  PAID
                         ▲                        │
                         └──── cabut persetujuan ─┘
```

Perhitungan selalu dimulai dari nol dan menarik ulang seluruh sumbernya — data
karyawan, komponen gaji, kehadiran, lembur yang disetujui, dan pinjaman berjalan —
sehingga hasilnya tidak pernah bergantung pada riwayat perhitungan sebelumnya.
Penulisannya dibungkus satu transaksi agar periode tidak pernah tertinggal dalam
keadaan setengah terhitung.

Periode berstatus `PAID` terkunci: tidak bisa dihitung ulang maupun dihapus. Saat
ditandai dibayar, saldo cicilan pinjaman berkurang dan setiap karyawan menerima
notifikasi bahwa slipnya sudah tersedia.

---

## Fitur

**Kepegawaian** — data induk karyawan dengan NPWP, PTKP, rekening, dan kepesertaan
BPJS · struktur departemen & posisi dengan rentang gaji · rekap kehadiran bulanan
dengan peta panas · persetujuan cuti dengan pemeriksaan kuota dan tumpang tindih ·
persetujuan lembur dengan pratinjau nilai.

**Penggajian** — komponen gaji nominal tetap atau persentase gaji pokok, kena pajak
atau tidak · pinjaman karyawan dengan cicilan otomatis · proses gaji berstatus ·
slip gaji siap cetak lengkap dengan terbilang · arsip slip seluruh karyawan.

**Analitik** — tren biaya tenaga kerja · komposisi potongan · biaya per departemen ·
bentang biaya 3D departemen × periode · sebaran status PTKP · ekspor CSV: rincian
payroll, daftar transfer bank, dan rekap PPh 21 untuk SPT Masa.

**Sistem** — tiga peran dengan batas akses berbeda · jejak audit setiap perubahan ·
notifikasi dalam aplikasi · palet perintah `⌘K` · mode terang dan gelap.

---

## Arsitektur

```
src/
├─ app/
│  ├─ page.tsx              beranda: visi, misi, latar 3D
│  ├─ login/                masuk
│  ├─ (app)/                aplikasi terlindungi — sidebar, topbar, palet perintah
│  ├─ payslip/[id]/         slip gaji siap cetak (tata letak A4 sendiri)
│  └─ api/                  pencarian & ekspor CSV
├─ actions/                 server action per domain, tervalidasi Zod
├─ components/
│  ├─ ui/                   design system: kaca, grafik SVG, tabel, modal
│  ├─ shell/                sidebar, palet perintah, notifikasi, tema
│  └─ three/                visualisasi WebGL
└─ lib/
   ├─ tax.ts                tabel & rumus PPh 21
   ├─ payroll-engine.ts     mesin penggajian
   ├─ auth.ts               sesi JWT, kontrol peran, audit
   └─ analytics.ts          agregasi untuk dasbor & laporan
```

Halaman ditulis sebagai Server Component dan menulis lewat Server Action; tidak ada
lapisan API perantara untuk mutasi. Pencarian dan penyaring tabel menulis ke URL,
bukan ke state lokal, sehingga halaman tetap dirender di server dan hasil filter
bisa dibagikan lewat tautan.

Sesi disimpan sebagai JWT bertanda tangan di cookie `httpOnly`. Setiap halaman dan
setiap server action memeriksa perannya sendiri — pembatasan tidak pernah hanya
mengandalkan sidebar yang menyembunyikan menu.

Nilai uang disimpan sebagai bilangan bulat rupiah, tanpa pecahan, supaya tidak ada
penyimpangan floating point pada perhitungan berantai.

---

## Catatan desain

**Liquid glass.** Permukaan kaca dibangun dari empat lapis: blur dengan penajaman
saturasi, gradient miring agar arah cahaya konsisten, garis specular di tepi atas,
dan bayangan ganda supaya kartu terlihat mengambang. Ditambah butiran film halus
di latar untuk melunakkan kesan permukaan digital yang terlalu rata.

**Palet.** Grafit dingin dengan satu aksen jade. Sengaja direm — ini aplikasi yang
dipakai berjam-jam, bukan halaman promosi.

**Grafik.** Ditulis sendiri sebagai SVG, tanpa pustaka grafik. Palet kategorikalnya
divalidasi terhadap ambang keterbacaan buta warna dan kontras untuk mode terang dan
gelap secara terpisah. Setiap grafik punya lapisan hover, legenda, dan alternatif
tabel — identitas seri tidak pernah bergantung pada warna saja.

**Tiga dimensi.** Three.js dipakai di dua tempat dan keduanya punya alasan: jaring
partikel di beranda sebagai atmosfer, dan bentang balok di dasbor yang setiap
baloknya adalah angka biaya sungguhan dari basis data. Keduanya menghormati
`prefers-reduced-motion` dan berhenti merender saat tab tidak terlihat.

---

## Stack

Next.js 15 (App Router, Server Actions) · TypeScript · Prisma + SQLite ·
Tailwind CSS v4 · Three.js · Zod · jose (JWT) · lucide-react
