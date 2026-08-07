import Link from 'next/link';
import {
  ArrowRight, Calculator, CalendarClock, Compass, FileText, Fingerprint,
  Layers, Receipt, ShieldCheck, Sparkles, Target, Wallet,
} from 'lucide-react';
import { getSession, homeFor } from '@/lib/auth';
import { GlassCard, Chip } from '@/components/ui/Glass';
import ThemeToggle from '@/components/shell/ThemeToggle';
import HeroBackdrop from '@/components/three/HeroBackdrop';

const MISI = [
  {
    icon: Calculator,
    title: 'Menghapus kerja hitung manual',
    body: 'PPh 21 metode TER, iuran BPJS lima program, lembur Kepmenaker, dan potongan berjalan dalam satu proses. Tidak ada lagi spreadsheet berformula rapuh yang diwariskan antar staf.',
  },
  {
    icon: Fingerprint,
    title: 'Membuat angka bisa ditelusuri',
    body: 'Setiap rupiah pada slip gaji punya jejak: dari komponen mana, tarif berapa, dasar hukumnya apa. Karyawan bisa memeriksa sendiri tanpa harus bertanya ke HRD.',
  },
  {
    icon: ShieldCheck,
    title: 'Menjaga kepatuhan tetap murah',
    body: 'Tarif dan plafon disimpan sebagai konfigurasi, bukan ditanam di kode. Ketika regulasi berubah, yang diperbarui cukup satu halaman pengaturan.',
  },
  {
    icon: CalendarClock,
    title: 'Memindahkan waktu HRD ke manusia',
    body: 'Kehadiran, cuti, dan lembur mengalir otomatis ke perhitungan gaji. Waktu yang tadinya habis merekap dipakai untuk mengurus orangnya.',
  },
];

const FITUR = [
  { icon: Wallet, t: 'Proses gaji berstatus', d: 'Draf → terhitung → disetujui → dibayar, dengan kunci di tiap tahap.' },
  { icon: Receipt, t: 'Slip gaji siap cetak', d: 'Rincian lengkap penerimaan, potongan, dan pajak. Ekspor PDF sekali klik.' },
  { icon: Layers, t: 'Komponen gaji fleksibel', d: 'Nominal tetap atau persentase gaji pokok, kena pajak atau tidak.' },
  { icon: CalendarClock, t: 'Kehadiran & lembur', d: 'Absen masuk-pulang, deteksi terlambat, lembur dengan pengganda resmi.' },
  { icon: FileText, t: 'Laporan & ekspor', d: 'Rekap bank, rekap PPh 21, biaya per departemen — semuanya CSV.' },
  { icon: ShieldCheck, t: 'Peran & jejak audit', d: 'Admin, HRD, dan karyawan punya batas akses masing-masing.' },
];

const STACK = [
  ['Next.js 15', 'App Router, Server Actions'],
  ['TypeScript', 'ketat, tanpa any liar'],
  ['Prisma + SQLite', 'skema relasional 16 tabel'],
  ['Three.js', 'visualisasi biaya 3D'],
  ['Tailwind v4', 'design token liquid glass'],
  ['JWT httpOnly', 'sesi & kontrol peran'],
];

export default async function LandingPage() {
  const session = await getSession();

  return (
    <main className="relative">
      {/* ─────────────────────────── Hero ─────────────────────────── */}
      <section className="relative min-h-[92vh] overflow-hidden">
        <HeroBackdrop className="absolute inset-0 opacity-70" />

        <div className="relative mx-auto flex max-w-6xl flex-col px-6">
          <nav className="flex items-center justify-between py-6">
            <span className="flex items-center gap-2.5">
              <Mark />
              <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-strong)' }}>
                NusaPay
              </span>
            </span>
            <span className="flex items-center gap-2">
              <ThemeToggle compact />
              <Link href={session ? homeFor(session.role) : '/login'} className="btn btn-primary btn-sm">
                {session ? 'Buka aplikasi' : 'Masuk'}
                <ArrowRight size={14} />
              </Link>
            </span>
          </nav>

          <div className="flex flex-1 items-center py-16 sm:py-24">
            <div className="max-w-2xl">
              <div className="rise" style={{ animationDelay: '60ms' }}>
                <Chip tone="jade" dot>
                  Payroll engine untuk regulasi Indonesia
                </Chip>
              </div>

              <h1
                className="rise mt-5 text-[2.6rem] leading-[1.06] font-semibold sm:text-6xl"
                style={{ animationDelay: '140ms', letterSpacing: '-0.032em' }}
              >
                Gaji dihitung benar,
                <br />
                <span style={{ color: 'var(--accent)' }}>sampai rupiah terakhir.</span>
              </h1>

              <p
                className="rise mt-6 max-w-xl text-[0.95rem] leading-relaxed"
                style={{ animationDelay: '220ms' }}
              >
                NusaPay menyatukan kehadiran, lembur, cuti, tunjangan, BPJS, dan PPh 21 ke dalam
                satu proses penggajian yang bisa ditelusuri. Dibangun untuk perusahaan yang sudah
                kewalahan dengan spreadsheet, tetapi belum siap membayar lisensi HRIS tahunan.
              </p>

              <div className="rise mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: '300ms' }}>
                <Link href={session ? homeFor(session.role) : '/login'} className="btn btn-primary">
                  {session ? 'Lanjut ke dasbor' : 'Coba dengan akun demo'}
                  <ArrowRight size={15} />
                </Link>
                <Link href="#visi" className="btn btn-ghost">
                  Visi &amp; misi
                </Link>
              </div>

              <dl
                className="rise mt-12 grid max-w-lg grid-cols-3 gap-6"
                style={{ animationDelay: '380ms' }}
              >
                {[
                  ['26', 'karyawan aktif'],
                  ['44', 'lapis tarif TER'],
                  ['5', 'program BPJS'],
                ].map(([n, l]) => (
                  <div key={l}>
                    <dt className="tnum text-2xl font-semibold" style={{ color: 'var(--text-strong)' }}>
                      {n}
                    </dt>
                    <dd className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {l}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────── Visi & misi ────────────────────────── */}
      <section id="visi" className="mx-auto max-w-6xl scroll-mt-8 px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div className="lg:sticky lg:top-12 lg:self-start">
            <span
              className="flex items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.14em] uppercase"
              style={{ color: 'var(--accent)' }}
            >
              <Compass size={13} />
              Visi
            </span>
            <h2 className="mt-4 text-[1.75rem] leading-tight font-semibold sm:text-[2.1rem]">
              Setiap pekerja Indonesia menerima gaji yang benar, tepat waktu, dan bisa
              dimengerti.
            </h2>
            <p className="mt-5 text-sm leading-relaxed">
              Slip gaji seharusnya bukan dokumen yang diterima dengan pasrah. Ia adalah
              pertanggungjawaban — dan pertanggungjawaban hanya bermakna kalau bisa dibaca oleh
              orang yang menerimanya.
            </p>

            <div className="mt-8 border-t pt-6" style={{ borderColor: 'var(--hairline)' }}>
              <span
                className="flex items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.14em] uppercase"
                style={{ color: 'var(--accent)' }}
              >
                <Target size={13} />
                Misi
              </span>
              <p className="mt-3 text-sm leading-relaxed">
                Empat hal yang dikerjakan produk ini, dan hanya empat, supaya tidak melebar
                menjadi perangkat lunak serba bisa yang tidak menguasai apa pun.
              </p>
            </div>
          </div>

          <ol className="space-y-3">
            {MISI.map((m, i) => (
              <li key={m.title}>
                <GlassCard hover className="flex gap-4">
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-xl"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    <m.icon size={17} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="tnum text-[0.6875rem] font-semibold" style={{ color: 'var(--text-muted)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-[0.9375rem] font-semibold">{m.title}</h3>
                    </div>
                    <p className="mt-1.5 text-[0.8125rem] leading-relaxed">{m.body}</p>
                  </div>
                </GlassCard>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ──────────────────────────── Fitur ──────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <span
              className="flex items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.14em] uppercase"
              style={{ color: 'var(--accent)' }}
            >
              <Sparkles size={13} />
              Yang sudah berjalan
            </span>
            <h2 className="mt-3 text-2xl font-semibold sm:text-[1.75rem]">
              Bukan mockup — seluruh alurnya bisa dijalankan
            </h2>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FITUR.map((f) => (
            <GlassCard key={f.t} hover className="flex flex-col gap-3">
              <span
                className="grid size-9 place-items-center rounded-lg"
                style={{ background: 'var(--field-bg)', color: 'var(--accent)' }}
              >
                <f.icon size={16} />
              </span>
              <div>
                <h3 className="text-sm font-semibold">{f.t}</h3>
                <p className="mt-1 text-[0.8125rem] leading-relaxed">{f.d}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ───────────────────────── Mesin hitung ───────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <GlassCard className="overflow-hidden !p-0">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 sm:p-10">
              <Chip tone="brass">Inti produk</Chip>
              <h2 className="mt-4 text-2xl font-semibold">Mesin pajak yang ditulis dari regulasinya</h2>
              <p className="mt-4 text-sm leading-relaxed">
                Perhitungan PPh 21 mengikuti PP 58/2023: tarif efektif rata-rata bulanan dengan
                tiga kategori (A, B, C) sesuai status PTKP, 44 lapisan tarif per kategori, dan
                sanksi 20% bagi karyawan tanpa NPWP. Masa Desember memakai tarif progresif Pasal
                17 UU HPP untuk menutup selisih setahun.
              </p>
              <ul className="mt-6 space-y-2.5">
                {[
                  'Biaya jabatan 5% dengan plafon Rp 500.000 per bulan',
                  'BPJS Kesehatan berplafon Rp 12 juta, JP berplafon Rp 10,5 juta',
                  'Lembur 1/173 upah sebulan dengan pengganda hari kerja & hari libur',
                  'Premi JKK/JKM perusahaan ikut menambah bruto kena pajak',
                ].map((s) => (
                  <li key={s} className="flex gap-2.5 text-[0.8125rem]">
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
              className="flex flex-col justify-center gap-px border-t p-8 sm:p-10 lg:border-t-0 lg:border-l"
              style={{ borderColor: 'var(--hairline)', background: 'var(--field-bg)' }}
            >
              <p className="label !mb-3">Contoh perhitungan — TK/0, gaji Rp 14.200.000</p>
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
                  <span className="text-[0.8125rem]">{k}</span>
                  <span className="tnum text-[0.8125rem] font-semibold" style={{ color: 'var(--text-strong)' }}>
                    {v}
                  </span>
                </div>
              ))}
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-strong)' }}>
                  Diterima
                </span>
                <span className="tnum text-lg font-semibold" style={{ color: 'var(--accent)' }}>
                  Rp 14.456.920
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* ─────────────────────────── Stack ─────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-6 text-lg font-semibold">Dibangun dengan</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {STACK.map(([n, d]) => (
            <div
              key={n}
              className="glass-thin flex items-baseline justify-between gap-3 px-4 py-3"
            >
              <span className="text-[0.8125rem] font-medium" style={{ color: 'var(--text-strong)' }}>
                {n}
              </span>
              <span className="text-[0.6875rem]" style={{ color: 'var(--text-muted)' }}>
                {d}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────── Penutup ─────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-20">
        <GlassCard className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold">Masuk dengan akun demo</h2>
            <p className="mt-1.5 text-[0.8125rem]">
              Tiga peran tersedia — administrator, HRD, dan karyawan — masing-masing dengan
              tampilan dan hak akses berbeda.
            </p>
          </div>
          <Link href="/login" className="btn btn-primary shrink-0">
            Mulai
            <ArrowRight size={15} />
          </Link>
        </GlassCard>

        <footer
          className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-8 text-xs sm:flex-row"
          style={{ borderColor: 'var(--hairline)', color: 'var(--text-muted)' }}
        >
          <span>NusaPay — proyek portofolio oleh Zainul Arkaan</span>
          <span>Next.js · Prisma · Three.js</span>
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
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M4 15V5.5a1 1 0 0 1 1.6-.8l8.8 6.6a1 1 0 0 1 0 1.6L10 16"
          stroke="#eaf5f0"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
