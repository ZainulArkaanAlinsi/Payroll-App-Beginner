'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { SubmitButton, Toast } from '@/components/ui/Feedback';
import { createRun } from '@/actions/payroll';
import type { ActionState } from '@/lib/types';
import { labelPeriode } from '@/lib/format';

export default function RunDialog({
  suggestedPeriod,
  payDay,
  takenPeriods,
}: {
  suggestedPeriod: string;
  payDay: number;
  takenPeriods: string[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(createRun, {});
  const [period, setPeriod] = useState(suggestedPeriod);
  const [kind, setKind] = useState<'REGULAR' | 'THR'>('REGULAR');
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  // tanggal bayar mengikuti pengaturan perusahaan, tetapi tetap bisa diubah
  const [y, m] = period.split('-').map(Number);
  const hariMax = new Date(y || 2025, m || 1, 0).getDate();
  const payDate = `${period}-${String(Math.min(payDay, hariMax)).padStart(2, '0')}`;

  const sudahAda = takenPeriods.includes(period);

  return (
    <>
      <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
        <Plus size={14} />
        Proses gaji baru
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Buat proses gaji"
        description="Satu periode hanya boleh punya satu proses. THR dihitung terpisah dari gaji bulanan."
      >
        <form action={action} className="space-y-4">
          <div>
            <span className="label">Jenis proses</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {([
                ['REGULAR', 'Gaji bulanan', 'Kehadiran, lembur, tunjangan, BPJS, dan PPh 21'],
                ['THR', 'Tunjangan Hari Raya', 'Prorata masa kerja, tanpa BPJS, PPh 21 metode selisih'],
              ] as const).map(([v, judul, ket]) => (
                <label
                  key={v}
                  className="glass-thin cursor-pointer px-3.5 py-3"
                  style={{
                    borderColor:
                      kind === v ? 'color-mix(in srgb, var(--accent) 40%, transparent)' : undefined,
                    background: kind === v ? 'var(--accent-soft)' : undefined,
                  }}
                >
                  <span className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="kind"
                      value={v}
                      checked={kind === v}
                      onChange={() => setKind(v)}
                      className="mt-0.5 size-4 shrink-0"
                      style={{ accentColor: 'var(--color-jade-600)' }}
                    />
                    <span className="min-w-0">
                      <span className="block t-small font-semibold" style={{ color: 'var(--text-strong)' }}>
                        {judul}
                      </span>
                      <span className="block t-micro leading-snug">{ket}</span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {kind === 'THR' && (
            <label className="block">
              <span className="label">Hari raya</span>
              <input
                name="holidayName"
                required
                className="field"
                placeholder="mis. Idulfitri 1447 H"
                list="hari-raya"
              />
              <datalist id="hari-raya">
                <option value="Idulfitri 1447 H" />
                <option value="Natal 2026" />
                <option value="Nyepi 1948 Saka" />
                <option value="Waisak 2570 BE" />
              </datalist>
              <span className="mt-1 block t-micro">
                Permenaker 6/2016: THR wajib dibayarkan paling lambat 7 hari sebelum hari raya.
              </span>
            </label>
          )}
          <label className="block">
            <span className="label">Periode</span>
            <input
              name="period"
              type="month"
              required
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="field"
            />
            {period && (
              <span
                className="mt-1 block t-micro"
                style={{ color: sudahAda ? 'var(--color-clay-500)' : 'var(--text-muted)' }}
              >
                {sudahAda
                  ? `${labelPeriode(period)} sudah pernah dibuat — pilih periode lain.`
                  : kind === 'THR'
                    ? 'Masa kerja dihitung sampai tanggal pembayaran di bawah.'
                    : `Akan dibuat sebagai “Gaji ${labelPeriode(period)}”.`}
              </span>
            )}
          </label>

          <label className="block">
            <span className="label">Tanggal pembayaran</span>
            <input name="payDate" type="date" required defaultValue={payDate} key={payDate} className="field" />
            <span className="mt-1 block t-micro" style={{ color: 'var(--text-muted)' }}>
              Bawaan mengikuti tanggal gajian perusahaan (tanggal {payDay}).
            </span>
          </label>

          <label className="block">
            <span className="label">Catatan (opsional)</span>
            <input name="note" className="field" placeholder="mis. termasuk THR" />
          </label>

          <div
            className="-mx-5 -mb-4 flex items-center justify-end gap-2 border-t px-5 py-3"
            style={{ borderColor: 'var(--hairline)' }}
          >
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
              Batal
            </button>
            <SubmitButton className="btn btn-primary btn-sm" pendingLabel="Membuat…">
              {kind === 'THR' ? 'Buat proses THR' : 'Buat proses gaji'}
            </SubmitButton>
          </div>
        </form>
      </Modal>

      <Toast state={state.error ? state : null} />
    </>
  );
}
