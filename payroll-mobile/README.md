# Racik Karyawan — aplikasi ponsel

Portal mandiri karyawan untuk [Racik](../payroll-next). Absen masuk dan pulang,
riwayat kehadiran, slip gaji, pengajuan cuti dan lembur.

Dibuat dengan React Native (Expo SDK 57) dan expo-router.

---

## Menjalankan

Server webnya harus hidup lebih dulu — aplikasi ini tidak punya basis data
sendiri, semuanya lewat API.

```bash
# jendela pertama
cd ../payroll-next && npm run dev

# jendela kedua
npm install
npm start
```

Pindai kode QR yang muncul memakai **Expo Go** ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) ·
[iOS](https://apps.apple.com/app/expo-go/id982107779)), atau tekan `w` untuk
membukanya di peramban.

### Menghubungkan ke server

Perangkat asli dan emulator tidak mengenal `localhost` milik komputer Anda.
Isi alamat IP jaringan lokal komputer, atau alamat produksinya:

```bash
# .env
EXPO_PUBLIC_API_URL=http://192.168.1.5:3001
```

Cari alamat IP-nya dengan `ipconfig` (Windows) atau `ifconfig` (macOS/Linux).
Komputer dan ponsel harus berada di jaringan Wi-Fi yang sama. Alamat yang
sedang dipakai selalu tampil di bagian bawah layar masuk.

### Akun contoh

```
adit.prakoso@nusantaradigital.id
password123
```

Ketuk kartu akun contoh di layar masuk untuk mengisinya otomatis.

---

## Layar

**Beranda** — jam berjalan, tombol absen masuk atau pulang menyesuaikan keadaan
hari itu, sisa cuti, rekap kehadiran bulan berjalan, dan slip terakhir.

**Kehadiran** — riwayat per bulan dengan rekap per status dan total
keterlambatan. Bulan depan tidak bisa dibuka karena datanya belum ada.

**Slip gaji** — arsip slip yang sudah dibayarkan, termasuk THR, beserta total
yang diterima sepanjang tahun. Rinciannya memisahkan pendapatan dari potongan
supaya tidak perlu menafsirkan tanda minus.

**Pengajuan** — cuti dan lembur beserta riwayat dan status peninjauannya.
Pengajuan lembur menampilkan perkiraan rupiah sebelum dikirim.

**Profil** — data kepegawaian dan rekening gaji. Nomor rekening hanya
ditampilkan empat digit terakhir.

---

## Cara kerjanya

### Aturan tidak ditulis dua kali

React Native tidak bisa memanggil server action, jadi aplikasi web menyediakan
`/api/mobile` dengan token Bearer. Godaannya adalah menulis ulang aturan di
rute-rute itu — dan yang paling mungkin terlewat justru pemeriksaan yang
membosankan: sisa kuota cuti, tumpang tindih tanggal, lembur ganda di hari yang
sama. Karyawan yang mengajukan lewat ponsel akan menembus batas yang ditegakkan
di web.

Karena itu aturannya tinggal di `payroll-next/src/lib/self-service.ts`, dan
baik web maupun ponsel hanya menerjemahkan masukan ke sana. Pesan penolakan
yang muncul di ponsel adalah pesan yang sama persis dengan yang muncul di web.

### Token

Disimpan di Keychain (iOS) atau Keystore (Android) lewat `expo-secure-store`,
bukan AsyncStorage — umurnya 30 hari dan setara kunci masuk. Token ponsel
ditandai audiens tersendiri dan sesi web menolak token beraudiens, sehingga
token yang bocor dari perangkat hilang tidak bisa dipakai sebagai cookie web.

Saat aplikasi dibuka, token yang tersimpan diuji ke server, bukan sekadar
dianggap sah — akunnya bisa saja sudah dinonaktifkan.

### Waktu

Jam absen diambil dari jam server, bukan jam perangkat. Jam ponsel bisa diubah
pemiliknya, dan potongan keterlambatan dihitung dari data itu.

Tanggal kalender — tanggal cuti, tanggal kehadiran — dibaca dengan getter UTC
karena server menyimpannya sebagai tengah malam UTC. "2 November" harus tetap
2 November di zona mana pun.

---

## Struktur

```
app/
├─ _layout.tsx        penyedia sesi, tema, dan Stack
├─ index.tsx          gerbang: menahan tampilan sampai token diperiksa
├─ login.tsx
├─ (tabs)/            lima layar utama
└─ slip/[id].tsx      rincian slip gaji

src/
├─ api.ts             klien API dan bentuk datanya
├─ auth.tsx           konteks sesi
├─ storage.ts         penyimpanan token
├─ theme.ts           palet terang & gelap, selaras dengan web
├─ format.ts          rupiah, tanggal, durasi
└─ ui.tsx             kartu, tombol, lencana, keadaan kosong & galat
```

Mengikuti mode terang dan gelap perangkat. Sasaran sentuh minimal 48px. Setiap
daftar bisa ditarik untuk menyegarkan, dan setiap kegagalan jaringan
membedakan "tidak bisa menghubungi server" dari "server menolak" — penyebabnya
berbeda jauh, dan karyawan di lapangan lebih sering mengalami yang pertama.

---

## Perintah

```bash
npm start          # server pengembangan + kode QR
npm run android    # buka di emulator Android
npm run ios        # buka di simulator iOS (butuh macOS)
npm run web        # buka di peramban
npm run typecheck  # periksa tipe
```
