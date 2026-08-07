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
        description="Satu periode hanya boleh punya satu proses gaji."
      >
        <form action={action} className="space-y-4">
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
                className="mt-1 block text-[0.6875rem]"
                style={{ color: sudahAda ? 'var(--color-clay-500)' : 'var(--text-muted)' }}
              >
                {sudahAda
                  ? `${labelPeriode(period)} sudah pernah dibuat — pilih periode lain.`
                  : `Akan dibuat sebagai “Gaji ${labelPeriode(period)}”.`}
              </span>
            )}
          </label>

          <label className="block">
            <span className="label">Tanggal pembayaran</span>
            <input name="payDate" type="date" required defaultValue={payDate} key={payDate} className="field" />
            <span className="mt-1 block text-[0.6875rem]" style={{ color: 'var(--text-muted)' }}>
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
              Buat proses gaji
            </SubmitButton>
          </div>
        </form>
      </Modal>

      <Toast state={state.error ? state : null} />
    </>
  );
}
