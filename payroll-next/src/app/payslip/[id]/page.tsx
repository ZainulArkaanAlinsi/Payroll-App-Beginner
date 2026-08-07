import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { canManage, requireSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { labelPeriode, rupiah, tanggalPanjang } from '@/lib/format';
import type { BreakdownRow } from '@/lib/payroll-engine';
import PrintBar from './PrintBar';

export const metadata = { title: 'Slip Gaji' };

export default async function PayslipPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  const item = await prisma.payrollItem.findUnique({
    where: { id },
    include: {
      run: true,
      employee: {
        include: {
          department: { select: { name: true } },
          position: { select: { title: true } },
        },
      },
    },
  });
  if (!item) notFound();

  // Karyawan biasa hanya boleh melihat slipnya sendiri.
  if (!canManage(session.role) && item.employeeId !== session.employeeId) notFound();

  const [company, fields] = await Promise.all([
    prisma.companySetting.findUnique({ where: { id: 'singleton' } }),
    prisma.payslipField.findMany({
      select: { key: true, visible: true, section: true, sortOrder: true },
    }),
  ]);

  // Kolom yang belum terdaftar dianggap tampil, supaya slip tidak mendadak
  // kosong bila ada kolom baru yang belum dikonfigurasi HR.
  const tampil = (key: string) => fields.find((f) => f.key === key)?.visible ?? true;

  let rows: BreakdownRow[] = [];
  try {
    rows = item.breakdown ? (JSON.parse(item.breakdown) as BreakdownRow[]) : [];
  } catch {
    rows = [];
  }

  const penerimaan = rows.filter((r) => r.group === 'EARNING');
  const potongan = rows.filter((r) => r.group === 'DEDUCTION');
  const perusahaan = rows.filter((r) => r.group === 'EMPLOYER' && r.amount > 0);

  const NILAI_IDENTITAS: Record<string, { label: string; value: string }> = {
    nama: { label: 'Nama karyawan', value: item.employee.fullName },
    nomor: { label: 'Nomor induk', value: item.employee.employeeNo },
    jabatan: { label: 'Jabatan', value: item.employee.position?.title ?? '—' },
    departemen: { label: 'Departemen', value: item.employee.department?.name ?? '—' },
    ptkp: { label: 'Status PTKP', value: item.employee.ptkpStatus },
    npwp: { label: 'NPWP', value: item.employee.npwp ?? 'Tidak terdaftar' },
    rekening: {
      label: 'Rekening penerima',
      value: item.employee.bankAccount
        ? `${item.employee.bankName ?? ''} · ${item.employee.bankAccount}`
        : '—',
    },
    kehadiran: {
      label: 'Kehadiran',
      value: `${item.presentDays} hadir · ${item.leaveDays} cuti · ${item.absentDays} mangkir`,
    },
  };

  const identitas = fields
    .filter((f) => f.section === 'IDENTITAS' && f.visible && NILAI_IDENTITAS[f.key])
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((f) => ({ key: f.key, ...NILAI_IDENTITAS[f.key] }));

  const dibayar = item.run.status === 'PAID';
  // Kode ringkas untuk mencocokkan slip cetak dengan catatan sistem.
  const kode = item.id.slice(-10).toUpperCase();

  return (
    <main className="min-h-dvh px-4 py-6">
      <div className="mx-auto max-w-[52rem]">
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={canManage(session.role) ? `/payroll/${item.runId}` : '/me'}
            className="inline-flex items-center gap-1.5 t-label"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={13} />
            Kembali
          </Link>
          <PrintBar />
        </div>

        <article className="glass print-sheet relative overflow-hidden !p-0">
          {/* ── Kop surat ── */}
          <header className="slip-kop">
            <div className="flex flex-wrap items-start justify-between gap-6 px-9 pt-9 pb-6">
              <div className="flex items-start gap-3.5">
                <span
                  className="grid size-12 shrink-0 place-items-center rounded-xl font-bold"
                  style={{
                    background: 'linear-gradient(145deg, var(--color-jade-500), var(--color-jade-700))',
                    color: '#eaf5f0',
                    fontSize: '0.9375rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  {company?.logoInitials ?? 'ND'}
                </span>
                <div className="min-w-0">
                  <p className="t-title" style={{ fontSize: '1.0625rem' }}>
                    {company?.legalName ?? 'PT Nusantara Digital Karya'}
                  </p>
                  <p className="mt-1 max-w-[22rem] t-micro leading-snug">{company?.address}</p>
                  <p className="tnum t-micro">NPWP {company?.npwp}</p>
                </div>
              </div>

              <div className="text-right">
                <p
                  className="t-micro font-semibold tracking-[0.2em] uppercase"
                  style={{ color: 'var(--accent)' }}
                >
                  Slip Gaji
                </p>
                <p className="mt-0.5 t-title">{labelPeriode(item.run.period)}</p>
                <p className="t-micro">
                  Dibayarkan {tanggalPanjang(item.run.paidAt ?? item.run.payDate)}
                </p>
                <p className="tnum mt-1.5 t-micro">No. {kode}</p>
              </div>
            </div>

            {/* garis kop: tebal di kiri, menipis ke kanan — penanda dokumen resmi */}
            <div
              style={{
                height: 3,
                background:
                  'linear-gradient(90deg, var(--color-jade-600) 0%, var(--color-jade-500) 30%, var(--hairline) 100%)',
              }}
            />
          </header>

          {/* ── Identitas karyawan ── */}
          <section className="px-9 pt-7">
            <div
              className="grid gap-x-8 gap-y-3.5 rounded-xl px-5 py-4 sm:grid-cols-2"
              style={{ background: 'var(--field-bg)', border: '1px solid var(--hairline)' }}
            >
              {identitas.map((b) => (
                <div key={b.key} className="flex items-baseline justify-between gap-3">
                  <span className="t-micro shrink-0">{b.label}</span>
                  <span
                    className="min-w-0 text-right t-small"
                    style={{
                      color: 'var(--text-strong)',
                      fontWeight: b.key === 'nama' ? 650 : 500,
                    }}
                  >
                    {b.value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Penerimaan & potongan ── */}
          <section className="grid gap-x-9 gap-y-7 px-9 pt-7 sm:grid-cols-2">
            <Kolom
              judul="Penerimaan"
              baris={penerimaan}
              totalLabel="Penghasilan bruto"
              total={item.grossPay}
              nada="jade"
            />
            <Kolom
              judul="Potongan"
              baris={potongan}
              totalLabel="Total potongan"
              total={item.totalDeduction}
              nada="clay"
              kosong="Tidak ada potongan pada periode ini."
            />
          </section>

          {/* ── Gaji bersih ── */}
          <section className="px-9 pt-7">
            <div
              className="flex flex-wrap items-end justify-between gap-5 rounded-xl px-6 py-5"
              style={{
                background:
                  'linear-gradient(135deg, color-mix(in srgb, var(--accent) 13%, transparent), color-mix(in srgb, var(--accent) 5%, transparent))',
                border: '1px solid color-mix(in srgb, var(--accent) 26%, transparent)',
              }}
            >
              <div>
                <p className="t-micro font-semibold tracking-[0.14em] uppercase">
                  Gaji bersih diterima
                </p>
                <p
                  className="tnum mt-1"
                  style={{
                    fontSize: '1.875rem',
                    lineHeight: '2.25rem',
                    fontWeight: 680,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-strong)',
                  }}
                >
                  {rupiah(item.netPay)}
                </p>
                {tampil('terbilang') && (
                  <p className="mt-1.5 max-w-[24rem] t-micro italic">
                    Terbilang: {terbilang(item.netPay)} rupiah
                  </p>
                )}
              </div>

              {/* Cap status — pengganti stempel basah pada dokumen cetak */}
              {dibayar && (
                <span
                  className="shrink-0 rounded-lg px-3.5 py-2 text-center"
                  style={{
                    border: '2px solid color-mix(in srgb, var(--color-jade-600) 45%, transparent)',
                    color: 'var(--color-jade-600)',
                    transform: 'rotate(-4deg)',
                  }}
                >
                  <span className="block t-label font-bold tracking-[0.18em] uppercase">Lunas</span>
                  <span className="tnum block t-micro" style={{ color: 'inherit', opacity: 0.85 }}>
                    {tanggalPanjang(item.run.paidAt ?? item.run.payDate)}
                  </span>
                </span>
              )}
            </div>
          </section>

          {/* ── Dasar perhitungan & iuran perusahaan ── */}
          {(tampil('dasar_pajak') || (tampil('iuran_perusahaan') && perusahaan.length > 0)) && (
            <section className="grid gap-x-9 gap-y-6 px-9 pt-7 sm:grid-cols-2">
              {tampil('dasar_pajak') && (
                <div>
                  <JudulKecil>Dasar perhitungan PPh 21</JudulKecil>
                  <dl className="space-y-1.5">
                    <Kecil
                      k="Metode"
                      v={item.taxMethod === 'TER' ? 'Tarif Efektif Rata-rata' : 'Progresif Pasal 17'}
                    />
                    <Kecil k="Dasar pengenaan" v={rupiah(item.taxableIncome)} />
                    <Kecil k="Tarif diterapkan" v={`${item.terRate}%`} />
                    <Kecil k="PPh 21 dipotong" v={rupiah(item.pph21)} tegas />
                  </dl>
                  <p className="mt-2 t-micro leading-snug">
                    {item.taxMethod === 'TER'
                      ? 'PP 58/2023 tentang tarif efektif pemotongan PPh Pasal 21.'
                      : 'Pasal 17 UU HPP — perhitungan tahunan masa Desember.'}
                    {!item.employee.npwp && ' Tanpa NPWP, tarif ditambah 20%.'}
                  </p>
                </div>
              )}

              {tampil('iuran_perusahaan') && perusahaan.length > 0 && (
                <div>
                  <JudulKecil>Ditanggung perusahaan</JudulKecil>
                  <dl className="space-y-1.5">
                    {perusahaan.map((r, i) => (
                      <Kecil key={i} k={r.label} v={rupiah(r.amount)} />
                    ))}
                    <Kecil k="Total biaya perusahaan" v={rupiah(item.employerCost)} tegas />
                  </dl>
                  <p className="mt-2 t-micro leading-snug">
                    Iuran ini tidak dipotong dari gaji Anda — dibayarkan perusahaan di luar
                    penghasilan bruto.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* ── Kaki dokumen ── */}
          {tampil('catatan_kaki') && (
            <footer
              className="mt-8 flex flex-wrap items-end justify-between gap-6 border-t px-9 py-6"
              style={{ borderColor: 'var(--hairline)', background: 'var(--field-bg)' }}
            >
              <p className="max-w-[24rem] t-micro leading-relaxed">
                <ShieldCheck size={12} className="mr-1 inline align-[-1px]" />
                Dokumen ini dihasilkan otomatis dan sah tanpa tanda tangan basah. Cocokkan nomor{' '}
                <strong className="tnum" style={{ color: 'var(--text-body)' }}>
                  {kode}
                </strong>{' '}
                dengan catatan sistem bila diperlukan. Bila ada selisih, hubungi bagian SDM paling
                lambat 7 hari setelah tanggal pembayaran.
              </p>
              <p className="text-right t-micro leading-relaxed">
                {company?.name}
                <br />
                Bagian Sumber Daya Manusia
                <br />
                <span style={{ opacity: 0.8 }}>{company?.email}</span>
              </p>
            </footer>
          )}
        </article>
      </div>
    </main>
  );
}

/** Satu kolom rincian dengan garis titik penghubung dan baris total. */
function Kolom({
  judul,
  baris,
  totalLabel,
  total,
  nada,
  kosong,
}: {
  judul: string;
  baris: BreakdownRow[];
  totalLabel: string;
  total: number;
  nada: 'jade' | 'clay';
  kosong?: string;
}) {
  const warna = nada === 'jade' ? 'var(--text-strong)' : 'var(--color-clay-500)';
  return (
    <div>
      <JudulKecil>{judul}</JudulKecil>

      <ul className="space-y-2">
        {baris.map((r, i) => (
          <li key={i} className="flex items-baseline gap-2">
            <span className="min-w-0 t-small">
              {r.label}
              {r.note && <span className="block t-micro leading-snug">{r.note}</span>}
            </span>
            {/* Garis titik menuntun mata dari nama komponen ke angkanya —
                kebiasaan tata letak dokumen keuangan cetak. */}
            <span
              aria-hidden
              className="mb-1 min-w-4 flex-1"
              style={{ borderBottom: '1px dotted var(--hairline)' }}
            />
            <span className="tnum shrink-0 t-small" style={{ color: warna, fontWeight: 550 }}>
              {nada === 'clay' ? '(' : ''}
              {rupiah(r.amount)}
              {nada === 'clay' ? ')' : ''}
            </span>
          </li>
        ))}
        {baris.length === 0 && <li className="t-micro">{kosong}</li>}
      </ul>

      <div
        className="mt-3.5 flex items-baseline justify-between gap-3 border-t pt-3"
        style={{ borderColor: 'var(--hairline)' }}
      >
        <span className="t-small" style={{ color: 'var(--text-strong)', fontWeight: 600 }}>
          {totalLabel}
        </span>
        <span className="tnum t-body" style={{ color: warna, fontWeight: 680 }}>
          {nada === 'clay' ? '(' : ''}
          {rupiah(total)}
          {nada === 'clay' ? ')' : ''}
        </span>
      </div>
    </div>
  );
}

function JudulKecil({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-3 t-micro font-semibold tracking-[0.14em] uppercase"
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </h2>
  );
}

function Kecil({ k, v, tegas }: { k: string; v: string; tegas?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="t-micro">{k}</dt>
      <dd
        className="tnum text-right t-label"
        style={{ color: 'var(--text-strong)', fontWeight: tegas ? 650 : 500 }}
      >
        {v}
      </dd>
    </div>
  );
}

/** Angka menjadi kata — slip gaji Indonesia lazim mencantumkan terbilang. */
function terbilang(n: number): string {
  const satuan = [
    '', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
    'sepuluh', 'sebelas',
  ];

  const konversi = (x: number): string => {
    if (x < 12) return satuan[x];
    if (x < 20) return `${konversi(x - 10)} belas`;
    if (x < 100) return `${konversi(Math.floor(x / 10))} puluh ${konversi(x % 10)}`.trim();
    if (x < 200) return `seratus ${konversi(x - 100)}`.trim();
    if (x < 1000) return `${konversi(Math.floor(x / 100))} ratus ${konversi(x % 100)}`.trim();
    if (x < 2000) return `seribu ${konversi(x - 1000)}`.trim();
    if (x < 1_000_000) return `${konversi(Math.floor(x / 1000))} ribu ${konversi(x % 1000)}`.trim();
    if (x < 1_000_000_000)
      return `${konversi(Math.floor(x / 1_000_000))} juta ${konversi(x % 1_000_000)}`.trim();
    return `${konversi(Math.floor(x / 1_000_000_000))} miliar ${konversi(x % 1_000_000_000)}`.trim();
  };

  if (n === 0) return 'nol';
  const kata = konversi(Math.floor(n)).replace(/\s+/g, ' ').trim();
  return kata.charAt(0).toUpperCase() + kata.slice(1);
}
