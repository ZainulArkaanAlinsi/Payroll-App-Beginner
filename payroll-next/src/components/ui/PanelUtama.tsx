import Link from 'next/link';

/**
 * Panel utama dasbor.
 *
 * Satu angka dibesarkan jauh melampaui yang lain: jumlah uang yang benar-benar
 * berpindah ke rekening karyawan. Dari semua yang tampil di halaman ini, itulah
 * satu-satunya yang ditanyakan orang tanpa perlu membuka apa pun — dan angka
 * yang dijadikan sebesar ini tidak perlu dicari; ia sudah terbaca sebelum mata
 * sempat memindai.
 *
 * Panelnya gelap pada kedua tema, bukan mengikuti latar halaman. Itu disengaja:
 * ia menjadi satu-satunya bidang gelap di halaman terang, sehingga batas antara
 * "ringkasan" dan "rincian" terbaca dari bentuknya saja. Aplikasi ponsel Racik
 * memakai panel yang sama di puncak layarnya, jadi orang yang berpindah dari
 * ponsel ke layar HRD menemukan bentuk yang sudah dikenalnya.
 */
export default function PanelUtama({
  eyebrow,
  judul,
  keterangan,
  nilai,
  nilaiLabel,
  delta,
  aksi = [],
  anak,
  samping,
}: {
  eyebrow?: string;
  judul: string;
  keterangan?: string;
  /** Angka utama. Dibiarkan kosong pada halaman yang memang tidak punya satu
      angka yang pantas dibesarkan — panel tetap bekerja sebagai kepala halaman. */
  nilai?: string;
  nilaiLabel?: string;
  delta?: { persen: number; catatan: string } | null;
  aksi?: { href: string; teks: string; utama?: boolean; ikon?: React.ReactNode }[];
  /** Tombol atau dialog yang tidak berupa tautan biasa. */
  anak?: React.ReactNode;
  /** Sisi kanan panel: kartu bank, ringkasan angka, atau apa pun yang cocok. */
  samping?: React.ReactNode;
}) {
  const naik = (delta?.persen ?? 0) >= 0;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        borderRadius: 24,
        background: 'linear-gradient(145deg, #1b5443 0%, #123a2f 45%, #0c2620 100%)',
        boxShadow:
          '0 1px 2px rgb(8 20 16 / .3), 0 18px 40px -22px rgb(8 20 16 / .55), inset 0 1px 0 rgb(255 255 255 / .1)',
      }}
    >
      {/* pendar hangat di sudut, meniru cahaya yang jatuh miring ke permukaan */}
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          top: -160,
          right: -80,
          width: 420,
          height: 420,
          background:
            'radial-gradient(circle, rgb(125 190 166 / .22) 0%, rgb(125 190 166 / 0) 68%)',
        }}
      />

      <div className="relative flex flex-col gap-7 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div className="min-w-0">
          <p
            style={{
              color: 'rgb(255 255 255 / .5)',
              fontSize: 10.5,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </p>
          <h1
            className={eyebrow ? 'mt-2' : ''}
            style={{
              color: 'rgb(255 255 255 / .92)',
              fontSize: 21,
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            {judul}
          </h1>

          {/* Angka utama. Bayangannya bukan hiasan — ia yang membuat angka
              terlihat mengambang di atas panel alih-alih tercetak padanya. */}
          {nilai && (
          <p
            className="tnum mt-5"
            style={{
              color: '#ffffff',
              fontSize: 'clamp(34px, 4.6vw, 56px)',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1,
              textShadow: '0 14px 34px rgb(4 14 11 / .55), 0 2px 4px rgb(4 14 11 / .3)',
            }}
          >
            {nilai}
          </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {nilaiLabel && (
              <span style={{ color: 'rgb(255 255 255 / .62)', fontSize: 12.5 }}>{nilaiLabel}</span>
            )}
            {delta && (
              <span
                className="tnum inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  background: naik ? 'rgb(125 190 166 / .18)' : 'rgb(255 255 255 / .12)',
                  color: naik ? '#a8dcc7' : 'rgb(255 255 255 / .78)',
                }}
              >
                {naik ? '↑' : '↓'} {Math.abs(delta.persen).toFixed(1)}%
                <span style={{ fontWeight: 400, opacity: 0.75 }}>{delta.catatan}</span>
              </span>
            )}
          </div>

          {keterangan && (
            <p className="mt-4" style={{ color: 'rgb(255 255 255 / .55)', fontSize: 12.5 }}>
              {keterangan}
            </p>
          )}

          {/* Tindakan berbentuk pil — bentuk yang sama dengan tombol di
              aplikasi ponsel, supaya keduanya terasa satu produk. */}
          {(aksi.length > 0 || anak) && (
          <div className="panel-aksi mt-6 flex flex-wrap items-center gap-2">
            {aksi.map((a) => (
              <Link
                key={a.href + a.teks}
                href={a.href}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 transition-colors"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  background: a.utama ? '#ffffff' : 'rgb(255 255 255 / .12)',
                  color: a.utama ? '#123a2f' : 'rgb(255 255 255 / .92)',
                  border: a.utama ? 'none' : '1px solid rgb(255 255 255 / .16)',
                }}
              >
                {a.ikon}
                {a.teks}
              </Link>
            ))}
            {anak}
          </div>
          )}
        </div>

        {samping && <div className="w-full shrink-0 lg:w-[340px]">{samping}</div>}
      </div>
    </section>
  );
}

/**
 * Angka pendamping di sisi kanan panel.
 *
 * Dibuat terpisah dari StatTile karena tempatnya berbeda: StatTile berdiri di
 * atas kartu kaca yang mengikuti tema halaman, sedangkan ini duduk di atas
 * panel yang selalu gelap. Memakai StatTile di sini menghasilkan kotak terang
 * di dalam bidang gelap — persis hal yang membuat panelnya berhenti terbaca
 * sebagai satu bidang utuh.
 */
export function RingkasPanel({
  nilai,
  label,
  catatan,
  tegang,
}: {
  nilai: string;
  label: string;
  catatan?: string;
  /** Menandai angka yang berbiaya bila dibiarkan, bukan sekadar angka besar. */
  tegang?: boolean;
}) {
  return (
    <div
      className="rounded-2xl px-4 py-3.5"
      style={{
        background: 'rgb(255 255 255 / .08)',
        border: '1px solid rgb(255 255 255 / .12)',
      }}
    >
      <p
        className="tnum"
        style={{
          color: tegang ? '#f0c88a' : '#ffffff',
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
        }}
      >
        {nilai}
      </p>
      <p style={{ color: 'rgb(255 255 255 / .62)', fontSize: 11.5, marginTop: 4 }}>{label}</p>
      {catatan && (
        <p style={{ color: 'rgb(255 255 255 / .4)', fontSize: 10.5, marginTop: 2 }}>{catatan}</p>
      )}
    </div>
  );
}
