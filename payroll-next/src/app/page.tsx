import Link from 'next/link';
import {
  ArrowRight, Banknote, BrainCircuit, Building2, CalendarClock, CircleAlert,
  CircleCheck, FileSpreadsheet, GitBranch, Layers, Receipt, ScrollText,
  ShieldCheck, SlidersHorizontal, Sparkles, Users, X,
} from 'lucide-react';
import { getSession, homeFor } from '@/lib/auth';
import { GlassCard, Chip } from '@/components/ui/Glass';
import ThemeToggle from '@/components/shell/ThemeToggle';
import HeroBackdrop from '@/components/three/HeroBackdrop';

export const metadata = {
  title: 'Racik — Payroll yang bisa diracik sendiri',
  description:
    'Mesin penggajian Indonesia yang rumusnya diatur HR sendiri, tanpa coding. PPh 21 metode TER, BPJS lima program, lembur Kepmenaker, dan slip gaji yang bisa ditelusuri.',
};

/* ── Masalah yang dialami perusahaan yang masih manual ── */
const KERUGIAN = [
  { t: 'Gaji telat cair', d: 'Rekap absensi, lembur, dan cuti menumpuk di akhir bulan. Karyawan menunggu tanpa kepastian.' },
  { t: 'Selisih hitung', d: 'Satu sel spreadsheet bergeser, satu orang terlanjur dibayar salah. Ketahuannya bulan depan.' },
  { t: 'Sulit diaudit', d: 'Ketika ditanya “kenapa segini?”, jawabannya harus dicari ulang dari file yang entah versi mana.' },
  { t: 'Bergantung satu orang', d: 'Semua rumus ada di kepala satu staf. Ia resign, perusahaan kehilangan cara menghitung gajinya sendiri.' },
];

/* ── Lima komponen inti sistem penggajian ── */
const KOMPONEN_INTI = [
  { icon: Users, t: 'Data induk karyawan', d: 'Jabatan, status pajak PTKP, nomor rekening, kepesertaan BPJS, dan gaji pokok dalam satu berkas hidup.' },
  { icon: CalendarClock, t: 'Integrasi kehadiran', d: 'Absensi, cuti, izin, dan jam lembur mengalir sendiri ke komponen gaji — tanpa salin-tempel.' },
  { icon: Layers, t: 'Komponen pendapatan', d: 'Tunjangan tetap, bonus, dan insentif. Nominal tetap, persentase, atau rumus racikan sendiri.' },
  { icon: Banknote, t: 'Potongan otomatis', d: 'PPh 21, iuran BPJS, cicilan kasbon, dan denda keterlambatan dipotong tanpa dihitung ulang.' },
  { icon: Receipt, t: 'Slip gaji digital', d: 'Terbit ke akun masing-masing karyawan, bisa dicetak, dan setiap barisnya bisa ditelusuri asalnya.' },
];

/* ── Yang membedakan Racik dari payroll siap pakai ── */
const PEMBEDA = [
  {
    icon: BrainCircuit,
    t: 'Perakit rumus',
    d: 'Payroll biasa rumusnya terkunci: gaji + lembur − potongan. Di Racik, HR menulis rumusnya sendiri seperti di Excel.',
    contoh: 'MIN(FLOOR(MASA_KERJA_BULAN / 12) * 250000; 2000000)',
    ket: 'Tunjangan masa kerja Rp 250 ribu per tahun, berhenti di Rp 2 juta.',
  },
  {
    icon: GitBranch,
    t: 'Alur persetujuan sendiri',
    d: 'Susun jalurnya sesuai kebijakan: staf HR menghitung → manajer HR menyetujui → direktur keuangan merilis dana.',
    contoh: 'Staf HR → Manajer HR → Direktur Keuangan',
    ket: 'Tahapnya bisa ditambah, diurutkan ulang, atau dinonaktifkan kapan saja.',
  },
  {
    icon: SlidersHorizontal,
    t: 'Aturan berbeda per divisi',
    d: 'Denda telat, tarif lembur, dan kebijakan absensi bisa berbeda antar departemen atau tingkat jabatan — dalam satu aplikasi.',
    contoh: 'Operasional: toleransi 10 menit · Direktur: dikecualikan',
    ket: 'Aturan paling spesifik menang atas aturan umum.',
  },
  {
    icon: FileSpreadsheet,
    t: 'Pemeta kolom bank',
    d: 'Susun sendiri urutan kolom berkas transfer, sehingga cocok dengan format bank mana pun tanpa menunggu pembaruan sistem.',
    contoh: 'BCA · Mandiri · atau susunan kolom Anda sendiri',
    ket: 'Nol di depan nomor rekening dijaga agar tidak hilang di Excel.',
  },
];

const MANUAL_VS = [
  ['Waktu proses', 'Berhari-hari, diperiksa tiga kali', 'Hitung ulang sepenuhnya dalam hitungan detik'],
  ['Risiko salah hitung', 'Tinggi — bergantung ketelitian orang', 'Rumus dijalankan mesin yang sama untuk semua'],
  ['Penelusuran', 'Harus dicari di berkas lama', 'Tiap baris slip menyimpan asal angkanya'],
  ['Ubah aturan', 'Semua rumus disunting satu per satu', 'Ubah di satu tempat, berlaku periode berikutnya'],
  ['Kepatuhan pajak', 'Dicek manual tiap ada aturan baru', 'Tarif & plafon berupa pengaturan, bukan kode'],
  ['Kerahasiaan data', 'Spreadsheet beredar lewat surel', 'Akses dibatasi per peran, tiap perubahan tercatat'],
];

const KEUNGGULAN = [
  { icon: CalendarClock, t: 'Efisiensi waktu', d: 'Rekap manual hilang; proses gaji sebulan selesai dalam satu perintah.' },
  { icon: CircleCheck, t: 'Akurasi tinggi', d: 'Nominal disimpan sebagai bilangan bulat rupiah, tanpa pembulatan yang menumpuk.' },
  { icon: ShieldCheck, t: 'Kepatuhan regulasi', d: 'PPh 21 TER, BPJS berplafon, dan lembur Kepmenaker mengikuti aturan yang berlaku.' },
  { icon: ScrollText, t: 'Transparansi', d: 'Karyawan melihat sendiri rincian gajinya tanpa perlu bertanya ke HRD.' },
  { icon: Building2, t: 'Siap diintegrasikan', d: 'Data kehadiran, cuti, dan lembur sudah menyatu di dalam satu basis data.' },
  { icon: Sparkles, t: 'Mudah dipakai', d: 'Dirancang untuk HR tanpa latar belakang IT — tidak ada baris kode yang perlu disentuh.' },
];

export default async function LandingPage() {
  const session = await getSession();
  const masuk = session ? homeFor(session.role) : '/login';

  return (
    <main className="relative">
      {/* ═══════════════════════ Hero ═══════════════════════ */}
      <section className="relative overflow-hidden">
        <HeroBackdrop className="absolute inset-0 opacity-60" />

        <div className="relative mx-auto max-w-6xl px-6">
          <nav className="flex items-center justify-between py-5">
            <span className="flex items-center gap-2.5">
              <Mark />
              <span className="t-title">Racik</span>
            </span>
            <span className="flex items-center gap-2">
              <Link href="#pembeda" className="btn btn-ghost btn-sm hidden sm:inline-flex">
                Apa bedanya
              </Link>
              <ThemeToggle compact />
              <Link href={masuk} className="btn btn-primary btn-sm">
                {session ? 'Buka aplikasi' : 'Masuk'}
                <ArrowRight size={14} />
              </Link>
            </span>
          </nav>

          <div className="grid items-center gap-12 py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:py-24">
            <div>
              <div className="rise" style={{ animationDelay: '60ms' }}>
                <Chip tone="jade" dot>
                  Mesin penggajian Indonesia
                </Chip>
              </div>

              <h1
                className="rise mt-5 font-semibold"
                style={{
                  animationDelay: '130ms',
                  fontSize: 'clamp(2.1rem, 5.2vw, 3.4rem)',
                  lineHeight: 1.08,
                  letterSpacing: '-0.03em',
                  color: 'var(--text-strong)',
                }}
              >
                Payroll yang bisa
                <br />
                <span style={{ color: 'var(--accent)' }}>diracik sendiri.</span>
              </h1>

              <p
                className="rise mt-6 max-w-xl"
                style={{ animationDelay: '200ms', fontSize: '1rem', lineHeight: 1.65 }}
              >
                Kebanyakan aplikasi payroll memaksa perusahaan menyesuaikan diri dengan rumus
                bawaannya. Racik membalik itu: HR menulis sendiri rumus gaji, aturan denda, jalur
                persetujuan, dan susunan slipnya — tanpa memanggil programmer.
              </p>

              <div className="rise mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: '270ms' }}>
                <Link href={masuk} className="btn btn-primary">
                  {session ? 'Lanjut ke aplikasi' : 'Masuk dengan akun demo'}
                  <ArrowRight size={15} />
                </Link>
                <Link href="#pembeda" className="btn btn-ghost">
                  Lihat bedanya
                </Link>
              </div>

              <dl className="rise mt-12 grid max-w-lg grid-cols-3 gap-6" style={{ animationDelay: '340ms' }}>
                {[
                  ['44', 'lapis tarif TER'],
                  ['5', 'program BPJS'],
                  ['0', 'baris kode untuk HR'],
                ].map(([n, l]) => (
                  <div key={l}>
                    <dt className="tnum t-display">{n}</dt>
                    <dd className="t-micro mt-0.5">{l}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* kartu contoh rumus — memperlihatkan produknya, bukan menjanjikannya */}
            <GlassCard className="rise !p-0" style={{ animationDelay: '400ms' }}>
              <div className="border-b px-5 py-3.5" style={{ borderColor: 'var(--hairline)' }}>
                <p className="t-heading">Tunjangan Masa Kerja</p>
                <p className="t-micro mt-0.5">Diracik langsung oleh HR, bukan dipesan ke vendor</p>
              </div>

              <div className="px-5 py-4">
                <p className="label">Rumus</p>
                <code
                  className="block rounded-lg px-3 py-2.5 font-mono"
                  style={{
                    background: 'var(--field-bg)',
                    color: 'var(--accent)',
                    fontSize: '0.75rem',
                    lineHeight: 1.6,
                  }}
                >
                  MIN(FLOOR(MASA_KERJA_BULAN / 12)
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;* 250000; 2000000)
                </code>

                <div
                  className="mt-3 flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                  style={{ background: 'rgb(46 133 104 / .12)' }}
                >
                  <CircleCheck size={14} style={{ color: 'var(--color-jade-500)' }} />
                  <span className="t-label">
                    Rumus sah — contoh hasil{' '}
                    <strong className="tnum" style={{ color: 'var(--text-strong)' }}>
                      Rp 500.000
                    </strong>
                  </span>
                </div>

                <ul className="mt-4 space-y-2 border-t pt-3.5" style={{ borderColor: 'var(--hairline)' }}>
                  {(
                    [
                      ['Kena pajak PPh 21', true],
                      ['Menambah dasar BPJS', false],
                      ['Diprorata bila masuk tengah bulan', false],
                    ] as const
                  ).map(([l, on]) => (
                    <li key={l} className="flex items-center justify-between gap-3">
                      <span className="t-small">{l}</span>
                      <span
                        className="grid size-4 place-items-center rounded-full"
                        style={{
                          background: on ? 'var(--color-jade-500)' : 'var(--field-bg)',
                          border: on ? 'none' : '1px solid var(--hairline)',
                        }}
                      >
                        {on ? <CircleCheck size={11} color="#fff" /> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ═══════════════ Masalah yang diselesaikan ═══════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <span className="label" style={{ color: 'var(--accent)' }}>
            Kenapa ini dibangun
          </span>
          <h2 className="mt-3 t-display" style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.1rem)' }}>
            Payroll manual jarang gagal sekaligus. Ia gagal sedikit demi sedikit.
          </h2>
          <p className="mt-4" style={{ fontSize: '0.9375rem', lineHeight: 1.7 }}>
            Selisih seratus ribu di satu slip terlihat kecil. Tetapi karyawan yang menerimanya
            menyimpulkan sesuatu tentang perusahaan tempat ia bekerja — dan kesimpulan itu jauh
            lebih mahal daripada selisihnya.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {KERUGIAN.map((k) => (
            <GlassCard key={k.t} hover className="flex flex-col gap-2.5">
              <span
                className="grid size-8 place-items-center rounded-lg"
                style={{ background: 'rgb(168 90 79 / .14)', color: 'var(--color-clay-500)' }}
              >
                <CircleAlert size={15} />
              </span>
              <h3 className="t-heading">{k.t}</h3>
              <p className="t-small">{k.d}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ═══════════════════ Pembeda utama ═══════════════════ */}
      <section id="pembeda" className="mx-auto max-w-6xl scroll-mt-6 px-6 py-16">
        <div className="mb-10 max-w-2xl">
          <span className="label" style={{ color: 'var(--accent)' }}>
            Yang tidak dimiliki payroll siap pakai
          </span>
          <h2 className="mt-3 t-display" style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.1rem)' }}>
            Empat hal yang biasanya harus dipesan ke vendor
          </h2>
          <p className="mt-4" style={{ fontSize: '0.9375rem', lineHeight: 1.7 }}>
            Di sebagian besar sistem, mengubah cara gaji dihitung berarti membuka tiket dan
            menunggu. Di Racik keempat hal ini ada di halaman pengaturan, dan HR yang memegangnya.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {PEMBEDA.map((p) => (
            <GlassCard key={p.t} hover className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-xl"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  <p.icon size={17} />
                </span>
                <div>
                  <h3 className="t-title" style={{ fontSize: '1rem' }}>
                    {p.t}
                  </h3>
                  <p className="mt-1 t-small">{p.d}</p>
                </div>
              </div>

              <div className="rounded-xl px-3.5 py-3" style={{ background: 'var(--field-bg)' }}>
                <code
                  className="block font-mono"
                  style={{ color: 'var(--accent)', fontSize: '0.6875rem', lineHeight: 1.6 }}
                >
                  {p.contoh}
                </code>
                <p className="t-micro mt-1.5">{p.ket}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ═══════════════ Komponen inti sistem ═══════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 max-w-2xl">
          <span className="label" style={{ color: 'var(--accent)' }}>
            Isi sistemnya
          </span>
          <h2 className="mt-3 t-display" style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.1rem)' }}>
            Lima bagian yang saling menyambung
          </h2>
        </div>

        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {KOMPONEN_INTI.map((k, i) => (
            <li key={k.t}>
              <GlassCard hover className="flex h-full flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span
                    className="grid size-9 place-items-center rounded-xl"
                    style={{ background: 'var(--field-bg)', color: 'var(--accent)' }}
                  >
                    <k.icon size={16} />
                  </span>
                  <span className="tnum t-micro font-semibold">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div>
                  <h3 className="t-heading">{k.t}</h3>
                  <p className="mt-1 t-small">{k.d}</p>
                </div>
              </GlassCard>
            </li>
          ))}
        </ol>
      </section>

      {/* ═══════════════ Manual vs Racik ═══════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <GlassCard className="!p-0">
          <div className="border-b px-6 py-5" style={{ borderColor: 'var(--hairline)' }}>
            <h2 className="t-title">Spreadsheet vs Racik</h2>
            <p className="t-small mt-1">
              Perbandingan yang jujur — spreadsheet menang di awal, dan kalah saat jumlah karyawan
              bertambah.
            </p>
          </div>

          <div className="tbl-scroll">
            <table className="tbl" style={{ minWidth: 660 }}>
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Aspek</th>
                  <th style={{ width: '39%' }}>
                    <span className="inline-flex items-center gap-1.5">
                      <X size={12} style={{ color: 'var(--color-clay-500)' }} />
                      Spreadsheet manual
                    </span>
                  </th>
                  <th style={{ width: '39%' }}>
                    <span className="inline-flex items-center gap-1.5">
                      <CircleCheck size={12} style={{ color: 'var(--color-jade-500)' }} />
                      Racik
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {MANUAL_VS.map(([aspek, manual, racik]) => (
                  <tr key={aspek}>
                    <td style={{ color: 'var(--text-strong)', fontWeight: 550 }}>{aspek}</td>
                    <td>{manual}</td>
                    <td style={{ color: 'var(--text-strong)' }}>{racik}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </section>

      {/* ═══════════════ Keunggulan ═══════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 max-w-2xl">
          <span className="label" style={{ color: 'var(--accent)' }}>
            Yang didapat perusahaan
          </span>
          <h2 className="mt-3 t-display" style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.1rem)' }}>
            Enam alasan pindah dari cara lama
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {KEUNGGULAN.map((k) => (
            <GlassCard key={k.t} hover className="flex gap-3">
              <span
                className="grid size-8 shrink-0 place-items-center rounded-lg"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                <k.icon size={15} />
              </span>
              <div>
                <h3 className="t-heading">{k.t}</h3>
                <p className="mt-1 t-small">{k.d}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ═══════════════ Mesin pajak ═══════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <GlassCard className="!p-0">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 sm:p-10">
              <Chip tone="brass">Kepatuhan</Chip>
              <h2 className="mt-4 t-display" style={{ fontSize: 'clamp(1.4rem, 3vw, 1.75rem)' }}>
                Mesin pajak yang ditulis dari regulasinya
              </h2>
              <p className="mt-4 t-body">
                PPh 21 mengikuti PP 58/2023: tarif efektif rata-rata bulanan dengan tiga kategori
                sesuai status PTKP, 44 lapisan tarif per kategori, dan sanksi 20% bagi karyawan
                tanpa NPWP. Masa Desember memakai tarif progresif Pasal 17 UU HPP.
              </p>
              <ul className="mt-6 space-y-2.5">
                {[
                  'Biaya jabatan 5% berplafon Rp 500.000 per bulan',
                  'BPJS Kesehatan berplafon Rp 12 juta, Jaminan Pensiun Rp 10,5 juta',
                  'Lembur 1/173 upah sebulan dengan pengganda hari kerja & hari libur',
                  'Metode Nett, Gross, atau Gross-up dapat dipilih per karyawan',
                ].map((s) => (
                  <li key={s} className="flex gap-2.5 t-small">
                    <span
                      className="mt-[7px] size-1.5 shrink-0 rounded-full"
                      style={{ background: 'var(--accent)' }}
                    />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="border-t p-8 sm:p-10 lg:border-t-0 lg:border-l"
              style={{ borderColor: 'var(--hairline)', background: 'var(--field-bg)' }}
            >
              <p className="label">Contoh — TK/0, gaji pokok Rp 14.200.000</p>
              {[
                ['Gaji pokok', 'Rp 14.200.000'],
                ['Tunjangan kena pajak', 'Rp 2.000.000'],
                ['Bruto kena pajak', 'Rp 16.812.000'],
                ['Tarif efektif TER A', '7%'],
                ['PPh 21 sebulan', 'Rp 1.176.840'],
                ['BPJS bagian karyawan', 'Rp 566.240'],
              ].map(([k, v], i, arr) => (
                <div
                  key={k}
                  className="flex items-baseline justify-between gap-4 py-2.5"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--hairline)' : undefined }}
                >
                  <span className="t-small">{k}</span>
                  <span className="t-money">{v}</span>
                </div>
              ))}
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <span className="t-heading">Diterima</span>
                <span className="t-money-lg" style={{ color: 'var(--accent)' }}>
                  Rp 14.456.920
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* ═══════════════ Penutup ═══════════════ */}
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-20">
        <GlassCard className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="t-title">Coba dengan akun demo</h2>
            <p className="mt-1.5 t-small">
              Tiga peran tersedia — administrator, HRD, dan karyawan — masing-masing dengan batas
              akses yang berbeda. Datanya sudah terisi 26 karyawan dan tiga periode gaji.
            </p>
          </div>
          <Link href={masuk} className="btn btn-primary shrink-0">
            Mulai
            <ArrowRight size={15} />
          </Link>
        </GlassCard>

        <footer
          className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-8 sm:flex-row"
          style={{ borderColor: 'var(--hairline)' }}
        >
          <span className="t-micro">Racik — proyek portofolio oleh Zainul Arkaan</span>
          <span className="t-micro">Next.js · Prisma · Three.js</span>
        </footer>
      </section>
    </main>
  );
}

function Mark() {
  return (
    <span
      className="grid size-8 place-items-center rounded-[10px]"
      style={{
        background: 'linear-gradient(145deg, var(--color-jade-500), var(--color-jade-700))',
        boxShadow: 'inset 0 1px 0 rgb(255 255 255 / .28), 0 2px 6px -2px rgb(20 55 46 / .5)',
      }}
    >
      {/* lesung & alu — lambang meracik */}
      <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M4 9h12a6 6 0 0 1-6 6 6 6 0 0 1-6-6Z"
          stroke="#eaf5f0"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M10 15v2.5M7 17.5h6" stroke="#eaf5f0" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M13.5 6.5 15.5 3" stroke="#eaf5f0" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    </span>
  );
}
