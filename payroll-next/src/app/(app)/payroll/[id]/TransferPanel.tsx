'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CircleAlert, CircleCheck, Download, OctagonX, RefreshCw, ShieldAlert, TriangleAlert,
} from 'lucide-react';
import { ActionButton, Toast } from '@/components/ui/Feedback';
import Modal from '@/components/ui/Modal';
import { Chip, GlassCard, SectionTitle } from '@/components/ui/Glass';
import { rupiah } from '@/lib/format';
import type { Temuan, RingkasanTransfer } from '@/lib/transfer';
import { tandaiSemuaTerkirim, tandaiTransfer, ulangiTransferGagal } from '@/actions/transfer';
import type { ActionState } from '@/lib/types';

export interface BarisStatus {
  itemId: string;
  employeeId: string;
  nama: string;
  bank: string;
  rekening: string;
  netPay: number;
  status: string;
  catatan: string | null;
}

export default function TransferPanel({
  runId,
  runStatus,
  temuan,
  ringkasan,
  baris,
  formats,
}: {
  runId: string;
  runStatus: string;
  temuan: Temuan[];
  ringkasan: RingkasanTransfer;
  baris: BarisStatus[];
  formats: { id: string; name: string }[];
}) {
  const [gagalkan, setGagalkan] = useState<BarisStatus | null>(null);
  const [alasan, setAlasan] = useState('');
  const [hasil, setHasil] = useState<ActionState | null>(null);
  const router = useRouter();

  const penghalang = temuan.filter((t) => t.tingkat === 'PENGHALANG');
  const peringatan = temuan.filter((t) => t.tingkat === 'PERINGATAN');
  const siap = penghalang.length === 0;

  const terkirim = baris.filter((b) => b.status === 'SENT').length;
  const gagal = baris.filter((b) => b.status === 'FAILED').length;
  const menunggu = baris.filter((b) => b.status === 'PENDING').length;

  return (
    <>
      <GlassCard>
        <SectionTitle
          title="Penyaluran dana"
          subtitle="Diperiksa lebih dulu supaya berkasnya tidak ditolak bank atau gagal sebagian"
          action={
            siap ? (
              <Chip tone="jade" dot>
                siap dikirim
              </Chip>
            ) : (
              <Chip tone="clay" dot>
                {penghalang.length} penghalang
              </Chip>
            )
          }
        />

        {/* ── Ringkasan instruksi ── */}
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="glass-thin px-4 py-3.5">
            <p className="label !mb-1">Total yang harus tersedia</p>
            <p className="t-money-lg">{rupiah(ringkasan.totalNominal)}</p>
            <p className="t-micro mt-0.5">
              untuk {ringkasan.jumlahPenerima} penerima · pastikan saldo rekening payroll mencukupi
            </p>
          </div>

          <div className="glass-thin px-4 py-3.5">
            <p className="label !mb-2">Rincian per bank</p>
            <ul className="space-y-1.5">
              {ringkasan.perBank.map((b) => (
                <li key={b.bank} className="flex items-baseline justify-between gap-3">
                  <span className="t-small">
                    {b.bank}
                    <span className="t-micro"> · {b.jumlah} orang</span>
                  </span>
                  <span className="tnum t-small" style={{ color: 'var(--text-strong)', fontWeight: 550 }}>
                    {rupiah(b.nominal)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Temuan pemeriksaan ── */}
        {temuan.length > 0 && (
          <ul className="mt-3 space-y-2">
            {[...penghalang, ...peringatan].map((t) => {
              const halang = t.tingkat === 'PENGHALANG';
              return (
                <li
                  key={t.kode}
                  className="glass-thin px-4 py-3"
                  style={{
                    borderColor: halang
                      ? 'color-mix(in srgb, var(--color-clay-500) 34%, transparent)'
                      : 'color-mix(in srgb, var(--color-brass-500) 30%, transparent)',
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    {halang ? (
                      <OctagonX size={15} className="mt-px shrink-0" style={{ color: 'var(--color-clay-500)' }} />
                    ) : (
                      <TriangleAlert size={15} className="mt-px shrink-0" style={{ color: 'var(--color-brass-500)' }} />
                    )}
                    <div className="min-w-0">
                      <p className="t-small" style={{ color: 'var(--text-strong)', fontWeight: 550 }}>
                        {t.pesan}
                      </p>
                      <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                        {t.terdampak.map((d) => (
                          <li key={d.id + t.kode}>
                            <Link href={`/employees/${d.id}`} className="t-micro hover:underline">
                              <span style={{ color: 'var(--text-body)' }}>{d.nama}</span>
                              {d.catatan && <span> — {d.catatan}</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {temuan.length === 0 && (
          <div
            className="mt-3 flex items-center gap-2.5 rounded-xl px-4 py-3"
            style={{ background: 'var(--accent-soft)' }}
          >
            <CircleCheck size={16} style={{ color: 'var(--color-jade-500)' }} />
            <p className="t-small">
              Seluruh rekening lengkap dan nominalnya wajar. Berkas transfer siap diunggah.
            </p>
          </div>
        )}

        {/* ── Unduh berkas ── */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3.5" style={{ borderColor: 'var(--hairline)' }}>
          <span className="label !mb-0 mr-1">Berkas transfer</span>
          {formats.map((f) => (
            <a
              key={f.id}
              href={`/api/export/bank/${runId}?format=${f.id}`}
              className={siap ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
              style={siap ? undefined : { opacity: 0.55 }}
              title={siap ? `Susunan kolom mengikuti format ${f.name}` : 'Masih ada penghalang — perbaiki lebih dulu'}
            >
              <Download size={13} />
              {f.name}
            </a>
          ))}
          {!siap && (
            <span className="t-micro" style={{ color: 'var(--color-clay-500)' }}>
              Berkas tetap bisa diunduh, tetapi barisnya kemungkinan besar ditolak bank.
            </span>
          )}
        </div>
      </GlassCard>

      {/* ── Pelacakan hasil transfer ── */}
      {runStatus === 'PAID' && (
        <GlassCard>
          <SectionTitle
            title="Hasil transfer"
            subtitle="Bank bisa menolak sebagian baris. Catat di sini supaya yang gagal tidak terlupakan."
            action={
              <span className="flex flex-wrap items-center gap-1.5">
                {terkirim > 0 && <Chip tone="jade">{terkirim} berhasil</Chip>}
                {menunggu > 0 && <Chip tone="brass">{menunggu} menunggu</Chip>}
                {gagal > 0 && <Chip tone="clay">{gagal} gagal</Chip>}
              </span>
            }
          />

          <div className="mb-3 flex flex-wrap gap-2">
            {menunggu > 0 && (
              <ActionButton
                action={tandaiSemuaTerkirim.bind(null, runId)}
                className="btn btn-primary btn-sm"
                confirmTitle="Tandai seluruh sisanya berhasil?"
                confirmLabel="Tandai berhasil"
                confirm={`${menunggu} baris yang masih menunggu akan ditandai berhasil. Baris yang sudah ditandai gagal tidak ikut berubah.`}
              >
                <CircleCheck size={13} />
                Tandai {menunggu} sisanya berhasil
              </ActionButton>
            )}
            {gagal > 0 && (
              <ActionButton
                action={ulangiTransferGagal.bind(null, runId)}
                className="btn btn-ghost btn-sm"
                confirmTitle="Kirim ulang yang gagal?"
                confirm={`${gagal} baris dikembalikan ke antrean supaya bisa diekspor ulang setelah rekeningnya diperbaiki.`}
              >
                <RefreshCw size={13} />
                Kembalikan {gagal} yang gagal ke antrean
              </ActionButton>
            )}
          </div>

          <div className="tbl-scroll scroll-slim">
            <table className="tbl" style={{ minWidth: 780 }}>
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Bank</th>
                  <th>Rekening</th>
                  <th className="text-right">Nominal</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {baris.map((b) => (
                  <tr key={b.itemId}>
                    <td>
                      <Link href={`/employees/${b.employeeId}`} style={{ color: 'var(--text-strong)', fontWeight: 550 }}>
                        {b.nama}
                      </Link>
                      {b.catatan && <span className="block t-micro">{b.catatan}</span>}
                    </td>
                    <td>{b.bank || '—'}</td>
                    <td className="tnum">{b.rekening || '—'}</td>
                    <td className="text-right">{rupiah(b.netPay)}</td>
                    <td>
                      {b.status === 'SENT' && <Chip tone="jade" dot>berhasil</Chip>}
                      {b.status === 'PENDING' && <Chip tone="brass" dot>menunggu</Chip>}
                      {b.status === 'FAILED' && <Chip tone="clay" dot>gagal</Chip>}
                      {b.status === 'HOLD' && <Chip tone="info" dot>ditahan</Chip>}
                    </td>
                    <td className="text-right">
                      {b.status !== 'FAILED' ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setAlasan('');
                            setGagalkan(b);
                          }}
                        >
                          <CircleAlert size={12} />
                          Tandai gagal
                        </button>
                      ) : (
                        <ActionButton
                          action={tandaiTransfer.bind(null, b.itemId, 'PENDING', undefined)}
                          className="btn btn-ghost btn-sm"
                        >
                          Kembalikan
                        </ActionButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {gagalkan && (
        <Modal
          open
          onClose={() => setGagalkan(null)}
          title={`Transfer ${gagalkan.nama} gagal`}
          description="Catat alasannya supaya jelas apa yang harus diperbaiki sebelum dikirim ulang."
        >
          <label className="block">
            <span className="label">Alasan penolakan bank</span>
            <input
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              className="field"
              placeholder="mis. rekening sudah tutup / nama tidak cocok"
              list="alasan-gagal"
            />
            <datalist id="alasan-gagal">
              <option value="Rekening sudah tutup" />
              <option value="Nama pemilik rekening tidak cocok" />
              <option value="Nomor rekening tidak ditemukan" />
              <option value="Rekening diblokir" />
            </datalist>
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setGagalkan(null)}>
              Batal
            </button>
            <ActionButton
              action={async () => {
                const s = await tandaiTransfer(gagalkan.itemId, 'FAILED', alasan.trim() || undefined);
                setGagalkan(null);
                setHasil(s);
                router.refresh();
                return s;
              }}
              className="btn btn-danger btn-sm"
            >
              <ShieldAlert size={13} />
              Tandai gagal
            </ActionButton>
          </div>
        </Modal>
      )}

      <Toast state={hasil} onDismiss={() => setHasil(null)} />
    </>
  );
}
