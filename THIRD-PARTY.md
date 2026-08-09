# Perangkat lunak pihak ketiga

Racik dibangun di atas 563 paket sumber terbuka. Berkas ini mencatat lisensinya
supaya siapa pun yang menerima atau membeli proyek ini bisa memeriksa
kewajibannya tanpa harus menelusuri sendiri pohon dependensinya.

Diperbarui: 9 Agustus 2026. Untuk menghasilkan ulang:

```bash
cd payroll-next   && npx license-checker --production --summary
cd payroll-mobile && npx license-checker --production --summary
```

---

## Ringkasan

| Lisensi | Paket | Sifat |
| --- | ---: | --- |
| MIT | 484 | permisif |
| Apache-2.0 | 23 | permisif, ada klausul paten |
| ISC | 23 | permisif |
| BSD-3-Clause | 8 | permisif |
| BlueOak-1.0.0 | 6 | permisif |
| BSD-2-Clause | 5 | permisif |
| 0BSD · Unlicense | 4 | permisif tanpa syarat |
| MPL-2.0 | 2 | copyleft lemah, per berkas |
| Apache-2.0 dan LGPL-3.0-or-later | 1 | copyleft lemah, per pustaka |
| CC-BY-4.0 | 1 | wajib atribusi |
| MIT dan OFL-1.1 | 1 | huruf |
| lain-lain (ganda / Python-2.0) | 5 | permisif |

Tidak ada satu pun dependensi berlisensi GPL murni maupun AGPL. Artinya
menggabungkan proyek ini ke dalam produk tertutup tidak memaksa kode sumbernya
ikut dibuka.

---

## Yang perlu diperhatikan

Sembilan dari 563 paket punya syarat di luar "cantumkan lisensinya". Semuanya
tetap boleh dipakai dalam produk komersial tertutup, tetapi masing-masing punya
kewajiban yang sebaiknya diketahui sebelum proyek ini dipindahtangankan.

### `@img/sharp-win32-x64` — Apache-2.0 dan LGPL-3.0-or-later

Biner pengolah gambar yang dipakai Next.js untuk mengoptimalkan gambar. Bagian
berlisensi LGPL adalah pustaka libvips, yang **ditaut secara dinamis**.

Menaut dinamis tidak membuat kode Anda ikut tunduk LGPL. Kewajibannya adalah
memungkinkan penerima mengganti pustaka tersebut dengan versi lain — terpenuhi
dengan sendirinya karena pustaka ini berupa berkas terpisah di `node_modules`,
bukan tertanam di dalam program.

Hanya terpasang di mesin Windows. Penempatan di Linux memakai varian lain dari
keluarga paket yang sama.

### `lightningcss` dan `lightningcss-win32-x64-msvc` — MPL-2.0

Pengolah CSS yang dipakai perkakas build. Copyleft-nya berlaku **per berkas**:
selama berkas milik paket itu sendiri tidak diubah, tidak ada kewajiban membuka
kode apa pun. Menggabungkannya ke dalam produk tertutup diperbolehkan secara
tegas oleh MPL-2.0 Pasal 3.3.

### `caniuse-lite` — CC-BY-4.0

Basis data dukungan peramban, dipakai saat build. Lisensinya menuntut atribusi,
yang dipenuhi oleh berkas ini.

### `@expo-google-fonts/plus-jakarta-sans` — MIT dan OFL-1.1

Huruf Plus Jakarta Sans, karya Tokotype. Berkas hurufnya berlisensi SIL Open
Font License 1.1, yang **mengizinkan huruf diedarkan maupun dijual bersama
perangkat lunak**. Yang dilarang OFL hanyalah menjual hurufnya sendiri sebagai
barang terpisah.

Salinan lisensinya ada di
`payroll-mobile/node_modules/@expo-google-fonts/plus-jakarta-sans/LICENSE_FONT`.

### `node-forge` — BSD-3-Clause atau GPL-2.0

Lisensi ganda; penerima boleh memilih salah satu. Untuk produk tertutup, pilih
**BSD-3-Clause** — cukup mencantumkan pemberitahuan hak ciptanya, tanpa
kewajiban copyleft apa pun.

### `argparse` — Python-2.0

Lisensi permisif dari Python Software Foundation. Kewajibannya hanya
mencantumkan pemberitahuan hak cipta.

---

## Kewajiban saat proyek ini diedarkan

Ketika Racik diserahkan, dijual, atau ditempatkan sebagai produk:

1. **Sertakan berkas ini**, atau daftar setara yang dihasilkan ulang dari pohon
   dependensi saat itu.
2. **Sertakan teks lisensi** untuk paket yang mensyaratkannya. Seluruh teksnya
   ada di dalam `node_modules` masing-masing dan ikut terbawa saat dependensi
   dipasang.
3. **Jangan hapus pemberitahuan hak cipta** dari berkas pihak ketiga mana pun.
4. Untuk aplikasi ponsel yang dirilis ke toko aplikasi, cantumkan atribusi ini
   di layar "Tentang" atau halaman legal — kedua toko mensyaratkannya.

Berkas ini menjelaskan keadaan dependensi, bukan nasihat hukum. Untuk transaksi
bernilai besar, mintalah tinjauan dari penasihat hukum Anda sendiri.
