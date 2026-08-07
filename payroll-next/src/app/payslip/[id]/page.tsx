import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
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
    prisma.payslipField.findMany({ select: { key: true, visible: true } }),
  ]);

  // Kolom yang disembunyikan HR di halaman Racik tidak dicetak di sini.
  // Kolom yang belum terdaftar dianggap tampil, supaya slip tidak
  // mendadak kosong bila ada kolom baru yang belum dikonfigurasi.
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

  const terbilangRp = terbilang(item.netPay);

  return (
    <main className="min-h-dvh px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={canManage(session.role) ? `/payroll/${item.runId}` : '/me'}
            className="inline-flex items-center gap-1.5 text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={13} />
            Kembali
          </Link>
          <PrintBar />
        </div>

        <article className="glass print-sheet p-8 sm:p-10">
          {/* ── kop ── */}
          <header
            className="flex flex-wrap items-start justify-between gap-6 border-b pb-6"
            style={{ borderColor: 'var(--hairline)' }}
          >
            <div className="flex items-start gap-3">
              <span
                className="grid size-11 shrink-0 place-items-center rounded-xl text-sm font-bold"
                style={{
                  background: 'linear-gradient(145deg, var(--color-jade-500), var(--color-jade-700))',
                  color: '#eaf5f0',
                }}
              >
                {company?.logoInitials ?? 'ND'}
              </span>
              <div>
                <h1 className="text-base font-semibold" style={{ color: 'var(--text-strong)' }}>
                  {company?.legalName ?? 'PT Nusantara Digital Karya'}
                </h1>
                <p className="mt-0.5 max-w-xs t-micro leading-snug" style={{ color: 'var(--text-muted)' }}>
                  {company?.address}
                </p>
                <p className="tnum t-micro" style={{ color: 'var(--text-muted)' }}>
                  NPWP {company?.npwp}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="t-micro tracking-[0.14em] uppercase" style={{ color: 'var(--text-muted)' }}>
                Slip Gaji
              </p>
              <p className="text-lg font-semibold" style={{ color: 'var(--text-strong)' }}>
                {labelPeriode(item.run.period)}
              </p>
              <p className="t-micro" style={{ color: 'var(--text-muted)' }}>
                Dibayarkan {tanggalPanjang(item.run.paidAt ?? item.run.payDate)}
              </p>
              <p className="tnum mt-1 t-micro" style={{ color: 'var(--text-muted)' }}>
                No. {item.id.slice(-10).toUpperCase()}
              </p>
            </div>
          </header>

          {/* ── identitas karyawan ── */}
          <section className="grid gap-x-8 gap-y-3 py-6 sm:grid-cols-2">
            {tampil('nama') && <Baris label="Nama karyawan" value={item.employee.fullName} strong />}
            {tampil('nomor') && <Baris label="Nomor induk" value={item.employee.employeeNo} />}
            {tampil('jabatan') && <Baris label="Jabatan" value={item.employee.position?.title ?? '—'} />}
            {tampil('departemen') && <Baris label="Departemen" value={item.employee.department?.name ?? '—'} />}
            {tampil('ptkp') && <Baris label="Status PTKP" value={item.employee.ptkpStatus} />}
            {tampil('npwp') && <Baris label="NPWP" value={item.employee.npwp ?? 'Tidak terdaftar'} />}
            {tampil('rekening') && (
            <Baris
              label="Rekening"
              value={
                item.employee.bankAccount
                  ? `${item.employee.bankName ?? ''} · ${item.employee.bankAccount}`
                  : '—'
              }
            />
            )}
            {tampil('kehadiran') && (
            <Baris
              label="Kehadiran"
              value={`${item.presentDays} hadir · ${item.leaveDays} cuti · ${item.absentDays} mangkir`}
            />
            )}
          </section>

          {/* ── penerimaan & potongan ── */}
          <section className="grid gap-8 border-t pt-6 sm:grid-cols-2" style={{ borderColor: 'var(--hairline)' }}>
            <div>
              <h2 className="mb-3 t-micro font-semibold tracking-[0.12em] uppercase" style={{ color: 'var(--text-muted)' }}>
                Penerimaan
              </h2>
              <ul className="space-y-2">
                {penerimaan.map((r, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 t-small">
                      {r.label}
                      {r.note && (
                        <span className="block t-micro" style={{ color: 'var(--text-muted)' }}>
                          {r.note}
                        </span>
                      )}
                    </span>
                    <span className="tnum shrink-0 t-small" style={{ color: 'var(--text-strong)' }}>
                      {rupiah(r.amount)}
                    </span>
                  </li>
                ))}
              </ul>
              <div
                className="mt-3 flex items-baseline justify-between border-t pt-2.5"
                style={{ borderColor: 'var(--hairline)' }}
              >
                <span className="t-small font-semibold" style={{ color: 'var(--text-strong)' }}>
                  Penghasilan bruto
                </span>
                <span className="tnum t-body font-semibold" style={{ color: 'var(--text-strong)' }}>
                  {rupiah(item.grossPay)}
                </span>
              </div>
            </div>

            <div>
              <h2 className="mb-3 t-micro font-semibold tracking-[0.12em] uppercase" style={{ color: 'var(--text-muted)' }}>
                Potongan
              </h2>
              <ul className="space-y-2">
                {potongan.map((r, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 t-small">
                      {r.label}
                      {r.note && (
                        <span className="block t-micro" style={{ color: 'var(--text-muted)' }}>
                          {r.note}
                        </span>
                      )}
                    </span>
                    <span className="tnum shrink-0 t-small" style={{ color: 'var(--color-clay-500)' }}>
                      ({rupiah(r.amount)})
                    </span>
                  </li>
                ))}
                {potongan.length === 0 && (
                  <li className="t-small" style={{ color: 'var(--text-muted)' }}>
                    Tidak ada potongan.
                  </li>
                )}
              </ul>
              <div
                className="mt-3 flex items-baseline justify-between border-t pt-2.5"
                style={{ borderColor: 'var(--hairline)' }}
              >
                <span className="t-small font-semibold" style={{ color: 'var(--text-strong)' }}>
                  Total potongan
                </span>
                <span className="tnum t-body font-semibold" style={{ color: 'var(--color-clay-500)' }}>
                  ({rupiah(item.totalDeduction)})
                </span>
              </div>
            </div>
          </section>

          {/* ── take home pay ── */}
          <section
            className="mt-6 flex flex-wrap items-end justify-between gap-4 rounded-xl px-5 py-4"
            style={{ background: 'var(--accent-soft)' }}
          >
            <div>
              <p className="t-micro tracking-[0.12em] uppercase" style={{ color: 'var(--text-muted)' }}>
                Gaji bersih diterima
              </p>
              <p className="tnum mt-1 text-2xl font-bold" style={{ color: 'var(--text-strong)' }}>
                {rupiah(item.netPay)}
              </p>
            </div>
            {tampil('terbilang') && (
              <p className="max-w-[16rem] text-right t-micro italic" style={{ color: 'var(--text-muted)' }}>
                Terbilang: {terbilangRp} rupiah
              </p>
            )}
          </section>

          {/* ── catatan pajak ── */}
          <section className="mt-6 grid gap-6 border-t pt-5 sm:grid-cols-2" style={{ borderColor: 'var(--hairline)' }}>
            {tampil('dasar_pajak') && (
            <div>
              <h3 className="mb-2 t-micro font-semibold tracking-[0.12em] uppercase" style={{ color: 'var(--text-muted)' }}>
                Dasar perhitungan PPh 21
              </h3>
              <dl className="space-y-1.5 t-label">
                <Kecil k="Metode" v={item.taxMethod === 'TER' ? 'Tarif Efektif Rata-rata (PP 58/2023)' : 'Progresif Pasal 17 UU HPP'} />
                <Kecil k="Bruto kena pajak" v={rupiah(item.taxableIncome)} />
                <Kecil k="Tarif diterapkan" v={`${item.terRate}%`} />
                <Kecil k="PPh 21 dipotong" v={rupiah(item.pph21)} />
                {!item.employee.npwp && (
                  <Kecil k="Catatan" v="Tanpa NPWP — tarif ditambah 20%" />
                )}
              </dl>
            </div>
            )}

            {tampil('iuran_perusahaan') && perusahaan.length > 0 && (
              <div>
                <h3 className="mb-2 t-micro font-semibold tracking-[0.12em] uppercase" style={{ color: 'var(--text-muted)' }}>
                  Iuran ditanggung perusahaan
                </h3>
                <dl className="space-y-1.5 t-label">
                  {perusahaan.map((r, i) => (
                    <Kecil key={i} k={r.label} v={rupiah(r.amount)} />
                  ))}
                  <Kecil
                    k="Total biaya perusahaan"
                    v={rupiah(item.employerCost)}
                    strong
                  />
                </dl>
              </div>
            )}
          </section>

          {tampil('catatan_kaki') && (
          <footer
            className="mt-8 flex flex-wrap items-end justify-between gap-6 border-t pt-5 t-micro"
            style={{ borderColor: 'var(--hairline)', color: 'var(--text-muted)' }}
          >
            <p className="max-w-sm leading-relaxed">
              Dokumen ini dihasilkan otomatis oleh sistem penggajian dan sah tanpa tanda tangan
              basah. Bila ada selisih, hubungi bagian SDM paling lambat 7 hari setelah tanggal
              pembayaran.
            </p>
            <p className="text-right">
              {company?.name}
              <br />
              Bagian Sumber Daya Manusia
            </p>
          </footer>
          )}
        </article>
      </div>
    </main>
  );
}

function Baris({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="t-micro tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p
        className="t-small"
        style={{ color: 'var(--text-strong)', fontWeight: strong ? 600 : 450 }}
      >
        {value}
      </p>
    </div>
  );
}

function Kecil({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt style={{ color: 'var(--text-muted)' }}>{k}</dt>
      <dd
        className="tnum text-right"
        style={{ color: 'var(--text-strong)', fontWeight: strong ? 600 : 450 }}
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
    if (x < 1_000_000_000) return `${konversi(Math.floor(x / 1_000_000))} juta ${konversi(x % 1_000_000)}`.trim();
    return `${konversi(Math.floor(x / 1_000_000_000))} miliar ${konversi(x % 1_000_000_000)}`.trim();
  };

  if (n === 0) return 'nol';
  const kata = konversi(Math.floor(n)).replace(/\s+/g, ' ').trim();
  return kata.charAt(0).toUpperCase() + kata.slice(1);
}
