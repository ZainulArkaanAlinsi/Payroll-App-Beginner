'use client';

import { useActionState, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleAlert, Download, TriangleAlert, Upload } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { SubmitButton, Toast } from '@/components/ui/Feedback';
import { jalankanImpor, pratinjauImpor, type HasilImpor, type RingkasanImpor } from '@/actions/impor';
import { rupiah } from '@/lib/format';

/**
 * Impor karyawan dari CSV.
 *
 * Dua langkah yang tidak bisa dilewati: berkas diperiksa dan hasilnya
 * ditampilkan, baru boleh dijalankan. Tombol "Impor sekarang" hanya muncul
 * setelah pratinjaunya bersih — bukan disembunyikan di balik peringatan yang
 * bisa diklik lewat begitu saja.
 */
export default function ImportDialog() {
  const [buka, setBuka] = useState(false);
  const [namaBerkas, setNamaBerkas] = useState('');
  const router = useRouter();
  const berkasRef = useRef<HTMLInputElement>(null);

  const [ringkas, periksaAksi] = useActionState<RingkasanImpor | null, FormData>(
    pratinjauImpor,
    null,
  );
  const [hasil, imporAksi] = useActionState<HasilImpor | null, FormData>(jalankanImpor, null);

  const bersih = ringkas?.ok === true && ringkas.galat.length === 0;
  const adaYangDikerjakan = (ringkas?.akanDibuat ?? 0) + (ringkas?.akanDiperbarui ?? 0) > 0;

  function tutup() {
    setBuka(false);
    setNamaBerkas('');
    if (hasil?.ok) router.refresh();
  }

  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBuka(true)}>
        <Upload size={14} />
        Impor CSV
      </button>

      <Modal open={buka} onClose={tutup} title="Impor karyawan dari CSV" wide>
        <div className="space-y-4">
          <div
            className="flex items-start gap-3 rounded-xl p-3"
            style={{ background: 'var(--field-bg)', border: '1px solid var(--hairline)' }}
          >
            <Download size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
            <div className="min-w-0">
              <p className="t-body" style={{ color: 'var(--text-strong)' }}>
                Cara paling aman: mulai dari berkas ekspor
              </p>
              <p className="mt-0.5 t-small">
                Unduh <a href="/api/export/employees" className="underline">Ekspor CSV</a>, sunting di
                Excel, lalu unggah kembali. Kolomnya sudah pasti cocok, dan karyawan yang sudah ada
                akan diperbarui — bukan diduplikasi.
              </p>
            </div>
          </div>

          {/* ── langkah 1: periksa ── */}
          <form action={periksaAksi} className="space-y-3">
            <label className="block">
              <span className="label">Berkas CSV</span>
              <input
                ref={berkasRef}
                type="file"
                name="berkas"
                accept=".csv,text/csv"
                required
                onChange={(e) => setNamaBerkas(e.target.files?.[0]?.name ?? '')}
                className="field w-full file:mr-3 file:rounded-md file:border-0 file:bg-transparent file:t-small"
              />
            </label>

            <SubmitButton className="btn btn-ghost btn-sm">Periksa berkas</SubmitButton>
          </form>

          {ringkas && !ringkas.ok && (
            <p className="flex items-start gap-2 t-small" style={{ color: 'var(--color-rust-500, #c0483c)' }}>
              <CircleAlert size={15} className="mt-px shrink-0" />
              {ringkas.pesan}
            </p>
          )}

          {/* ── langkah 2: hasil pemeriksaan ── */}
          {ringkas?.ok && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Angka nilai={ringkas.akanDibuat} label="akan dibuat" />
                <Angka nilai={ringkas.akanDiperbarui} label="akan diperbarui" />
                <Angka nilai={ringkas.galat.length} label="baris bermasalah" tegang={ringkas.galat.length > 0} />
              </div>

              {ringkas.galat.length > 0 && (
                <div
                  className="max-h-56 overflow-y-auto rounded-xl p-3"
                  style={{
                    background: 'color-mix(in srgb, var(--color-brass-500) 8%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--color-brass-500) 28%, transparent)',
                  }}
                >
                  <p className="flex items-center gap-2 t-body font-semibold" style={{ color: 'var(--text-strong)' }}>
                    <TriangleAlert size={15} style={{ color: 'var(--color-brass-500)' }} />
                    Perbaiki dulu di berkasnya
                  </p>
                  <ul className="mt-2 space-y-1">
                    {ringkas.galat.map((g, i) => (
                      <li key={`${g.nomor}-${g.kolom}-${i}`} className="t-small">
                        <span className="tnum font-semibold">Baris {g.nomor}</span>
                        <span style={{ color: 'var(--text-muted)' }}> · {g.kolom} — </span>
                        {g.pesan}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {ringkas.contoh.length > 0 && (
                <div className="rounded-xl" style={{ border: '1px solid var(--hairline)' }}>
                  <table className="w-full t-small">
                    <thead>
                      <tr style={{ color: 'var(--text-muted)' }}>
                        <th className="px-3 py-2 text-left font-medium">Baris</th>
                        <th className="px-3 py-2 text-left font-medium">Tindakan</th>
                        <th className="px-3 py-2 text-left font-medium">Karyawan</th>
                        <th className="px-3 py-2 text-right font-medium">Gaji pokok</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ringkas.contoh.map((c) => (
                        <tr key={c.nomor} style={{ borderTop: '1px solid var(--hairline)' }}>
                          <td className="tnum px-3 py-2">{c.nomor}</td>
                          <td className="px-3 py-2">
                            <span style={{ color: c.tindakan === 'buat' ? 'var(--accent)' : 'var(--text-body)' }}>
                              {c.tindakan === 'buat' ? 'Buat baru' : 'Perbarui'}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span style={{ color: 'var(--text-strong)' }}>{c.nama}</span>
                            <span style={{ color: 'var(--text-muted)' }}> · {c.surel}</span>
                            {c.catatan && (
                              <span className="t-micro" style={{ color: 'var(--text-muted)' }}> ({c.catatan})</span>
                            )}
                          </td>
                          <td className="tnum px-3 py-2 text-right">{rupiah(c.gaji)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {ringkas.akanDibuat + ringkas.akanDiperbarui > ringkas.contoh.length && (
                    <p className="px-3 py-2 t-micro" style={{ color: 'var(--text-muted)' }}>
                      menampilkan {ringkas.contoh.length} dari{' '}
                      {ringkas.akanDibuat + ringkas.akanDiperbarui} baris
                    </p>
                  )}
                </div>
              )}

              {/* ── langkah 3: jalankan ── */}
              {bersih && adaYangDikerjakan && (
                <form action={imporAksi} className="flex items-center justify-between gap-3 pt-1">
                  {/* Berkasnya diunggah ulang, bukan rencananya. Rencana yang
                      dikirim balik dari peramban bisa disunting di tengah
                      jalan — dan yang disunting adalah nominal gaji. */}
                  <input
                    type="file"
                    name="berkas"
                    accept=".csv,text/csv"
                    required
                    className="field flex-1 file:mr-3 file:rounded-md file:border-0 file:bg-transparent file:t-small"
                  />
                  <SubmitButton className="btn btn-primary btn-sm shrink-0">
                    Impor sekarang
                  </SubmitButton>
                </form>
              )}

              {bersih && adaYangDikerjakan && (
                <p className="t-micro" style={{ color: 'var(--text-muted)' }}>
                  Pilih ulang berkas yang sama untuk memastikan yang diimpor persis yang barusan diperiksa.
                  {namaBerkas && ` Berkas tadi: ${namaBerkas}`}
                </p>
              )}
            </div>
          )}

          {hasil && (
            <Toast
              state={
                hasil.ok
                  ? { ok: true, message: hasil.pesan }
                  : { ok: false, error: hasil.pesan }
              }
            />
          )}
        </div>
      </Modal>
    </>
  );
}

function Angka({ nilai, label, tegang }: { nilai: number; label: string; tegang?: boolean }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{ background: 'var(--field-bg)', border: '1px solid var(--hairline)' }}
    >
      <p
        className="tnum"
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: tegang ? 'var(--color-brass-500)' : 'var(--text-strong)',
        }}
      >
        {nilai}
      </p>
      <p className="t-micro" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}
