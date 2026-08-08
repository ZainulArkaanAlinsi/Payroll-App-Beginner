# Racik — Payroll yang bisa diracik sendiri

Mesin penggajian untuk perusahaan Indonesia. Menyatukan kehadiran, lembur, cuti,
tunjangan, iuran BPJS, PPh 21, dan THR ke dalam satu proses yang bisa ditelusuri
sampai rupiah terakhir.

Pembedanya ada pada namanya: **HR meracik sendiri** rumus gaji, aturan denda per
divisi, jalur persetujuan, susunan slip, dan format berkas transfer bank — tanpa
menyentuh kode dan tanpa menunggu vendor.

Proyek portofolio oleh **Zainul Arkaan**.

---

## Menjalankan

Butuh Node.js 18.18 atau lebih baru. Tidak perlu menyiapkan basis data — memakai SQLite.

```bash
npm run setup    # sekali saja: pasang dependensi, buat .env, buat tabel, isi data demo
npm run dev
```

Alamatnya muncul di terminal pada baris `Local:`. Biasanya <http://localhost:3000>,
tetapi bila port itu sedang dipakai program lain Next.js otomatis memilih port
berikutnya — jadi baca terminalnya, jangan berasumsi.

### Akun demo

Kata sandi untuk semua akun: `password123`

| Peran         | Surel                                       | Akses                                     |
| ------------- | ------------------------------------------- | ----------------------------------------- |
| Administrator | `admin@racik.id`                            | seluruh modul, pengaturan, jejak audit    |
| HRD           | `larasati.widyaningrum@nusantaradigital.id` | kepegawaian, proses gaji, laporan         |
| Karyawan      | `adit.prakoso@nusantaradigital.id`        | portal mandiri: absen, slip, cuti, lembur |

Data demonya terisi 26 karyawan, enam departemen, 14 posisi, lima bulan kehadiran,
tiga periode gaji yang sudah dibayarkan, satu proses THR, tujuh lembur dan dua cuti
yang menunggu persetujuan, serta satu pelanggaran PP 36/2021 yang sengaja ditanam
agar pemeriksa kepatuhannya terlihat bekerja.

### Perintah lain

```bash
npm test          # 113 uji mesin perhitungan
npm run build     # build produksi
npm start         # jalankan hasil build
npm run db:reset  # kosongkan lalu isi ulang data demo
```

---

## Yang bisa diracik HR

Empat hal yang di kebanyakan sistem harus dipesan ke vendor. Semuanya ada di
menu **Racik** dan berpengaruh langsung ke perhitungan berikutnya.

### Perakit rumus

Komponen gaji bisa bernilai tetap, persentase gaji pokok, atau **rumus yang
ditulis sendiri** seperti di Excel:

```
HARI_HADIR * 45000
MIN(FLOOR(MASA_KERJA_BULAN / 12) * 250000; 2000000)
IF(JUMLAH_TANGGUNGAN > 0; 300000 + JUMLAH_TANGGUNGAN * 150000; 0)
IF(MENIT_TELAT > 30; (MENIT_TELAT - 30) * 2500; 0)
```

Tersedia 13 variabel dan 7 fungsi. Editornya memeriksa rumus sambil diketik dan
menampilkan hasil contohnya.

Rumus dijalankan oleh tokenizer, shunting-yard, dan interpreter yang ditulis
sendiri — **bukan `eval()`**. `eval()` akan menjalankan JavaScript apa pun yang
tersimpan di basis data, artinya siapa pun yang bisa menyunting komponen gaji
bisa menjalankan kode di server. Parser di sini hanya mengenal angka, variabel
terdaftar, dan fungsi yang diizinkan; selain itu ditolak, di peramban maupun di
server.

Koma hanya dipakai sebagai tanda desimal dan titik koma sebagai pemisah argumen.
`MIN(1,5; 2)` ambigu bila keduanya diterima, dan menebak pada rumus yang
menghitung gaji orang lebih berbahaya daripada menolak.

### Aturan berbeda per divisi

Toleransi keterlambatan, denda, dan metode lembur boleh berbeda antar departemen
atau tingkat jabatan. Aturan paling spesifik menang: tingkat jabatan mengalahkan
departemen, keduanya mengalahkan aturan umum.

Contoh pada data demo: Operasional bertoleransi 10 menit dengan denda Rp 4.000
per menit, Direktur dikecualikan sepenuhnya, dan lembur Teknologi memakai tarif
rata alih-alih pengganda Kepmenaker.

### Alur persetujuan bertahap

Tahapnya disusun HR sendiri dan ditegakkan berurutan — melompati tahap ditolak,
penolakan menghapus persetujuan sebelumnya sehingga alurnya diulang dari awal,
dan menghitung ulang membatalkan seluruh persetujuan karena angkanya berubah.
Pembatasan peran diperiksa di server, bukan sekadar menyembunyikan tombol.

### Susunan slip & format bank

Baris slip bisa disembunyikan dan diurutkan ulang, berlaku juga pada slip periode
lampau. Format berkas transfer memetakan kolom, urutan, pemisah, dan awalannya
sendiri sehingga cocok dengan bank mana pun.

---

## Mesin perhitungan

Seluruhnya di `src/lib/`, terpisah dari lapisan tampilan sehingga bisa diuji
sendiri — dan memang diuji.

### PPh 21

- **Metode TER** (PP 58/2023) untuk masa Januari–November. Tiga kategori tarif
  dipilih dari status PTKP, masing-masing 44 lapisan atas penghasilan bruto.
- **Metode progresif** Pasal 17 UU HPP untuk masa Desember, menutup selisih
  setahun setelah dikurangi biaya jabatan, iuran BPJS karyawan, dan PTKP.
- Karyawan **tanpa NPWP** dikenakan tarif 20% lebih tinggi.
- Metode **Nett, Gross, atau Gross-up** dapat dipilih per karyawan. Gross-up
  memakai iterasi titik tetap karena tunjangan pajaknya sendiri kena pajak.

### BPJS

| Program          | Karyawan | Perusahaan | Plafon upah   |
| ---------------- | -------- | ---------- | ------------- |
| Kesehatan        | 1%       | 4%         | Rp 12.000.000 |
| Jaminan Hari Tua | 2%       | 3,7%       | tanpa plafon  |
| Jaminan Pensiun  | 1%       | 2%         | Rp 10.547.400 |
| JKK              | —        | 0,24%      | tanpa plafon  |
| JKM              | —        | 0,30%      | tanpa plafon  |

Premi Kesehatan, JKK, dan JKM yang dibayar perusahaan ikut menambah penghasilan
bruto kena pajak. Komponen mana yang menjadi dasar pengali BPJS ditentukan per
komponen, bukan diasumsikan seluruh tunjangan.

### Lembur

Kepmenaker 102/2004, pola lima hari kerja. Upah sejam = 1/173 × upah sebulan.
Hari kerja: jam pertama ×1,5, berikutnya ×2. Hari libur: jam 1–8 ×2, jam ke-9
×3, selebihnya ×4. Nilainya dikunci saat disetujui memakai upah yang berlaku
hari itu, sehingga kenaikan gaji kemudian tidak mengubah lembur yang lampau.

### THR

Permenaker 6/2016. Masa kerja 12 bulan atau lebih berhak sebulan upah penuh,
1–12 bulan diprorata, kurang dari sebulan belum berhak. Berlaku untuk karyawan
tetap maupun kontrak.

THR tergolong penghasilan tidak teratur, jadi pajaknya dihitung sebagai selisih
antara pajak atas penghasilan termasuk THR dan pajak atas penghasilan reguler
saja. Tanpa cara ini THR akan dikenai lapisan tarif terendah dan pemotongannya
kurang — yang baru ketahuan saat penghitungan ulang akhir tahun. THR tidak
dikenai iuran BPJS karena bukan upah bulanan.

### Prorata

Karyawan yang masuk atau berhenti di tengah periode dibayar menurut hari kerja
yang benar-benar dijalani. Komponen tunjangan bisa ditandai ikut diprorata atau
tidak, satu per satu.

---

## Alur proses gaji

```
DRAF  ──hitung──▶  TERHITUNG  ──setujui──▶  DISETUJUI  ──bayar──▶  DIBAYARKAN
                        ▲                        │
                        └──── cabut persetujuan ─┘
```

Perhitungan selalu dimulai dari nol dan menarik ulang seluruh sumbernya — data
karyawan, komponen gaji, kehadiran, lembur yang disetujui, dan pinjaman berjalan
— sehingga hasilnya tidak pernah bergantung pada riwayat perhitungan sebelumnya.
Penulisannya dibungkus satu transaksi agar periode tidak pernah tertinggal dalam
keadaan setengah terhitung.

Periode berstatus dibayarkan terkunci sepenuhnya.

### Sebelum dana dikirim

Berkas transfer massal ditolak bank atau gagal sebagian karena hal yang
sebenarnya bisa diketahui lebih dulu. Sebelum berkas diunduh, sistem memeriksa:

**Penghalang** — rekening atau nama bank kosong, nomor rekening memuat karakter
selain angka, nominal nol atau negatif, dan nomor rekening yang dipakai lebih
dari satu karyawan (satu orang menerima ganda, yang lain tidak menerima apa pun).

**Peringatan** — nama pemilik rekening berbeda dari nama karyawan, nominal
berubah lebih dari 50% dibanding periode sebelumnya, dan nomor rekening yang
terlalu pendek.

Disertai ringkasan total dan rincian per bank untuk memastikan saldo rekening
payroll mencukupi. Setelah berkas diproses bank, hasil tiap baris dicatat
tersendiri: yang gagal bisa diberi alasan penolakan dan dikembalikan ke antrean
untuk dikirim ulang tanpa mengganggu yang sudah berhasil.

### Kepatuhan ketenagakerjaan

Dua aturan yang tidak pernah menimbulkan galat di sistem mana pun dan baru jadi
masalah saat ada pemeriksaan: upah di bawah upah minimum daerah, dan gaji pokok
kurang dari 75% total upah menurut PP 36/2021 Pasal 7 ayat 2. Peringatannya
menetap di halaman data karyawan beserta dasar hukumnya. Upah minimum dan
wilayahnya diatur dari halaman Pengaturan.

---

## Modul

**Kepegawaian** — data induk karyawan dengan NPWP, PTKP, rekening, dan
kepesertaan BPJS · departemen & posisi dengan rentang gaji · rekap kehadiran
bulanan dengan peta panas · persetujuan cuti dengan pemeriksaan kuota dan
tumpang tindih · persetujuan lembur dengan pratinjau nilai.

**Penggajian** — komponen gaji tetap, persentase, atau berumus · pinjaman
karyawan dengan cicilan otomatis · proses gaji berstatus · THR · slip gaji siap
cetak lengkap dengan terbilang · arsip slip seluruh karyawan.

**Analitik** — ringkasan yang disusun langsung dari angka periode berjalan ·
perbandingan otomatis terhadap periode sebelumnya · biaya per departemen dengan
biaya per karyawan dan pangsanya · bentang biaya 3D departemen × periode ·
sebaran PTKP · ekspor CSV: rincian payroll, daftar transfer bank, dan rekap
PPh 21 untuk SPT Masa.

**Sistem** — tiga peran dengan batas akses berbeda · jejak audit setiap
perubahan · notifikasi dalam aplikasi · palet perintah `⌘K` · mode terang dan
gelap.

---

## Pengujian

```bash
npm test
```

113 uji menutupi tarif TER dan PTKP berikut sanksi tanpa NPWP, tarif progresif,
pengganda lembur, plafon tiap program BPJS, prorata, titik tetap gross-up,
pemilihan aturan per divisi, prorata THR dan pajak metode selisihnya, parser
rumus termasuk penolakan masukan berbahaya, pemeriksaan sebelum transfer, dan
pemeriksaan kepatuhan.

Memakai penjalan uji bawaan Node — tanpa kerangka uji tambahan.

Beberapa hal yang dijaga uji ini: tarif TER tidak pernah turun saat penghasilan
naik; masa kerja 20 Agustus 2025 sampai 19 Agustus 2026 dihitung 11 bulan, bukan
12; tunjangan gross-up konvergen ke pajak terutang dengan selisih paling banyak
satu rupiah; tanpa aturan divisi potongan keterlambatan bernilai nol, bukan
angka tebakan; dan bruto dikurangi potongan selalu sama dengan yang diterima.

---

## Arsitektur

```
src/
├─ app/
│  ├─ page.tsx              beranda
│  ├─ login/
│  ├─ (app)/                aplikasi terlindungi — sidebar, topbar, palet perintah
│  ├─ payslip/[id]/         slip gaji siap cetak, tata letak A4 sendiri
│  └─ api/                  pencarian & ekspor CSV
├─ actions/                 server action per domain, tervalidasi Zod
├─ components/
│  ├─ ui/                   design system: kaca, grafik SVG, tabel, modal
│  ├─ shell/                sidebar, palet perintah, notifikasi, tema
│  └─ three/                visualisasi WebGL
└─ lib/
   ├─ tax.ts                tabel & rumus PPh 21
   ├─ payroll-engine.ts     mesin penggajian
   ├─ formula.ts            parser rumus racikan HR
   ├─ thr.ts                tunjangan hari raya
   ├─ policy.ts             aturan per divisi
   ├─ transfer.ts           pemeriksaan sebelum transfer
   ├─ kepatuhan.ts          pemeriksaan ketenagakerjaan
   ├─ auth.ts               sesi JWT, kontrol peran, audit
   └─ analytics.ts          agregasi untuk dasbor & laporan
```

Halaman ditulis sebagai Server Component dan menulis lewat Server Action; tidak
ada lapisan API perantara untuk mutasi. Pencarian dan penyaring tabel menulis ke
URL, bukan ke state lokal, sehingga halaman tetap dirender di server dan hasil
filter bisa dibagikan lewat tautan.

Sesi disimpan sebagai JWT bertanda tangan di cookie `httpOnly`. Setiap halaman
dan setiap server action memeriksa perannya sendiri — pembatasan tidak pernah
hanya mengandalkan sidebar yang menyembunyikan menu.

Nilai uang disimpan sebagai bilangan bulat rupiah, tanpa pecahan, supaya tidak
ada penyimpangan floating point pada perhitungan berantai.

Satu penyelesai komponen dipakai bersama oleh skrip seed, proses gaji, dan
simulasi di halaman karyawan — sehingga angka pratinjau tidak mungkin berbeda
dengan hasil akhir.

---

## Catatan desain

**Skala tipografi.** Tujuh ukuran bernama, dan hanya itu. Sebelumnya tiap halaman
memakai angka arbitrer sehingga tidak ada dua halaman yang terasa sama.

**Liquid glass.** Permukaan kaca dibangun dari blur dengan penajaman saturasi,
gradient miring agar arah cahaya konsisten, garis specular di tepi atas, dan
bayangan ganda. Ditambah butiran film halus di latar untuk melunakkan kesan
permukaan digital yang terlalu rata. Seluruh kelas komponen berada di
`@layer components` supaya utility Tailwind selalu bisa menimpanya.

**Palet.** Grafit dingin dengan satu aksen jade. Sengaja direm — ini aplikasi
yang dipakai berjam-jam, bukan halaman promosi.

**Grafik.** Ditulis sendiri sebagai SVG, tanpa pustaka grafik. Palet
kategorikalnya divalidasi terhadap ambang keterbacaan buta warna dan kontras
untuk mode terang dan gelap secara terpisah. Setiap grafik punya lapisan hover,
legenda, dan alternatif tabel — identitas seri tidak pernah bergantung pada
warna saja. Sumbu grafik garis tidak dipaksa mulai dari nol agar perubahan kecil
tetap terbaca, dan karena itu bidang arsirnya dimatikan supaya luasnya tidak
membohongi pembaca.

**Tiga dimensi.** Three.js dipakai di dua tempat dan keduanya punya alasan:
jaring partikel di beranda sebagai atmosfer, dan bentang balok di dasbor yang
setiap baloknya adalah angka biaya sungguhan dari basis data. Keduanya
menghormati `prefers-reduced-motion` dan berhenti merender saat tab tidak
terlihat.

---

## Stack

Next.js 15 (App Router, Server Actions) · TypeScript · Prisma + SQLite ·
Tailwind CSS v4 · Three.js · Zod · jose (JWT) · lucide-react
