/**
 * Kartu rekening gaji.
 *
 * Kembaran komponen yang sama di aplikasi ponsel, dan itu disengaja: HR
 * melihat kartu yang persis sama dengan yang dilihat karyawannya. Ketika HR
 * mengubah nomor rekening di halaman ini, karyawan melihat perubahan itu pada
 * kartu di ponselnya — bukan pada baris teks yang mudah terlewat.
 *
 * Nomornya disamarkan kecuali empat digit terakhir. Halaman ini sering
 * terbuka saat layar dibagikan dalam rapat, dan empat digit sudah cukup untuk
 * mencocokkan dengan kartu asli karyawan.
 */

type GayaBank = { dari: string; ke: string; teks: string; nama?: string };

/**
 * Warna bank Indonesia, diambil dari identitas masing-masing supaya dikenali
 * sekilas. Bank yang tidak dikenal jatuh ke kelabu netral — kartu berwarna
 * asal justru menyesatkan.
 */
const WARNA: Record<string, GayaBank> = {
  BCA: { dari: '#1e5fa8', ke: '#0b3566', teks: '#fff' },
  BNI: { dari: '#f2762e', ke: '#b8451a', teks: '#fff' },
  BRI: { dari: '#1560a8', ke: '#0a3a68', teks: '#fff' },
  'BANK MANDIRI': { dari: '#1b4f8f', ke: '#06264e', teks: '#fff', nama: 'mandiri' },
  MANDIRI: { dari: '#1b4f8f', ke: '#06264e', teks: '#fff', nama: 'mandiri' },
  'BANK JAGO': { dari: '#f5a623', ke: '#c2760a', teks: '#1a1204', nama: 'jago' },
  JAGO: { dari: '#f5a623', ke: '#c2760a', teks: '#1a1204', nama: 'jago' },
  'CIMB NIAGA': { dari: '#9d2235', ke: '#5c0f1c', teks: '#fff', nama: 'CIMB Niaga' },
  BSI: { dari: '#00857e', ke: '#00514d', teks: '#fff' },
  PERMATA: { dari: '#0a4d8c', ke: '#052a4d', teks: '#fff' },
};

const NETRAL: GayaBank = { dari: '#3d444f', ke: '#1b1f26', teks: '#fff' };

function samarkan(nomor?: string | null) {
  const angka = (nomor ?? '').replace(/\D/g, '');
  if (!angka) return '•••• •••• •••• ••••';
  return `•••• •••• •••• ${angka.slice(-4)}`;
}

export function KartuBank({
  bank,
  nomor,
  pemilik,
  label = 'Rekening gaji',
}: {
  bank?: string | null;
  nomor?: string | null;
  pemilik?: string | null;
  label?: string;
}) {
  const g = bank ? (WARNA[bank.trim().toUpperCase()] ?? NETRAL) : NETRAL;
  const putih = g.teks === '#fff';
  const redup = putih ? 'rgb(255 255 255 / .62)' : 'rgb(0 0 0 / .55)';
  const kosong = !nomor?.trim();

  return (
    <div
      className="relative overflow-hidden"
      style={{
        // Perbandingan sisi kartu ISO/IEC 7810 ID-1 — ukuran kartu sungguhan.
        aspectRatio: '1.586',
        maxWidth: 340,
        borderRadius: 18,
        background: `linear-gradient(135deg, ${g.dari}, ${g.ke})`,
        boxShadow: '0 12px 30px rgb(16 24 40 / .22), 0 2px 6px rgb(16 24 40 / .16)',
      }}
    >
      {/* pantulan cahaya di sudut kanan atas */}
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          top: -70,
          right: -46,
          width: 180,
          height: 180,
          background: putih ? 'rgb(255 255 255 / .10)' : 'rgb(255 255 255 / .22)',
        }}
      />

      <div className="relative flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between">
          <div>
            <p style={{ color: g.teks, fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em' }}>
              {g.nama ?? bank ?? 'Belum diisi'}
            </p>
            <p style={{ color: redup, fontSize: 8.5, letterSpacing: '0.14em', marginTop: 1 }}>
              {label.toUpperCase()}
            </p>
          </div>

          {/* lambang nirsentuh */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden style={{ opacity: 0.75 }}>
            {[5, 9, 13].map((r, i) => (
              <path
                key={r}
                d={`M ${7 + i * 4} ${12 - r * 0.62} A ${r} ${r} 0 0 1 ${7 + i * 4} ${12 + r * 0.62}`}
                stroke={g.teks}
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            ))}
          </svg>
        </div>

        {/* cip */}
        <div
          aria-hidden
          className="relative flex flex-col justify-center gap-[3px] overflow-hidden px-[5px]"
          style={{
            width: 38,
            height: 29,
            borderRadius: 5,
            background: putih ? '#d8c48a' : 'rgb(255 255 255 / .75)',
          }}
        >
          <i className="block h-px" style={{ background: 'rgb(0 0 0 / .35)' }} />
          <i className="block h-px" style={{ background: 'rgb(0 0 0 / .35)' }} />
          <i className="block h-px" style={{ background: 'rgb(0 0 0 / .35)' }} />
          <i
            className="absolute top-1 bottom-1 left-1/2 w-px"
            style={{ background: 'rgb(0 0 0 / .35)' }}
          />
        </div>

        <div>
          <p
            className="tnum"
            style={{ color: g.teks, fontSize: 16, letterSpacing: '0.14em', fontWeight: 600 }}
          >
            {samarkan(nomor)}
          </p>
          <p
            className="truncate"
            style={{ color: redup, fontSize: 10.5, letterSpacing: '0.09em', marginTop: 6 }}
          >
            {(pemilik ?? 'NAMA BELUM DIISI').toUpperCase()}
          </p>
        </div>
      </div>

      {/* Rekening kosong berarti gaji orang ini tidak bisa ditransfer. Ditandai
          di kartunya sendiri, bukan hanya sebagai baris kosong di tabel. */}
      {kosong && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center"
          style={{ background: 'rgb(0 0 0 / .45)' }}
        >
          <p style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>Rekening belum diisi</p>
          <p style={{ color: 'rgb(255 255 255 / .72)', fontSize: 10.5 }}>
            Gaji tidak bisa ditransfer sebelum diisi
          </p>
        </div>
      )}
    </div>
  );
}
