'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Plus, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { ActionButton, SubmitButton, Toast } from '@/components/ui/Feedback';
import { reviewLeave, submitLeave } from '@/actions/requests';
import type { ActionState } from '@/lib/types';

const TIPE = [
  ['ANNUAL', 'Cuti tahunan'],
  ['SICK', 'Sakit'],
  ['UNPAID', 'Cuti di luar tanggungan'],
  ['MATERNITY', 'Cuti melahirkan'],
  ['SPECIAL', 'Cuti khusus'],
];

export function ReviewLeave({ id, name }: { id: string; name: string }) {
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState('');
  const [result, setResult] = useState<ActionState | null>(null);
  const router = useRouter();

  return (
    <div className="flex gap-1.5">
      <ActionButton
        action={reviewLeave.bind(null, id, 'APPROVED', undefined)}
        className="btn btn-primary btn-sm"
        confirm={`Setujui pengajuan cuti ${name}? Tanggalnya akan tercatat sebagai cuti pada kartu kehadiran.`}
      >
        <Check size={13} />
        Setujui
      </ActionButton>

      <button type="button" className="btn btn-danger btn-sm" onClick={() => setAsking(true)}>
        <X size={13} />
        Tolak
      </button>

      {asking && (
        <Modal
          open
          onClose={() => setAsking(false)}
          title={`Tolak pengajuan ${name}`}
          description="Alasan penolakan akan dikirim sebagai notifikasi ke karyawan."
        >
          <label className="block">
            <span className="label">Alasan penolakan</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="field resize-none"
              placeholder="mis. bentrok dengan jadwal rilis, mohon ajukan ulang minggu depan"
            />
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAsking(false)}>
              Batal
            </button>
            <ActionButton
              action={async () => {
                const s = await reviewLeave(id, 'REJECTED', note.trim() || undefined);
                setAsking(false);
                setResult(s);
                router.refresh();
                return s;
              }}
              className="btn btn-danger btn-sm"
            >
              Tolak pengajuan
            </ActionButton>
          </div>
        </Modal>
      )}

      <Toast state={result} onDismiss={() => setResult(null)} />
    </div>
  );
}

export function LeaveDialog({
  employees,
  fixedEmployeeId,
  label = 'Ajukan cuti',
}: {
  employees?: { id: string; fullName: string; employeeNo: string }[];
  fixedEmployeeId?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(submitLeave, {});
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
        <Plus size={14} />
        {label}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Ajukan cuti"
        description="Jumlah hari dihitung otomatis dari hari kerja (Senin–Jumat) dalam rentang."
      >
        <form action={action} className="space-y-4">
          {fixedEmployeeId ? (
            <input type="hidden" name="employeeId" value={fixedEmployeeId} />
          ) : (
            <label className="block">
              <span className="label">Karyawan</span>
              <select name="employeeId" required className="field">
                <option value="">Pilih karyawan…</option>
                {employees?.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.employeeNo} — {e.fullName}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block">
            <span className="label">Jenis cuti</span>
            <select name="type" required className="field" defaultValue="ANNUAL">
              {TIPE.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">Mulai</span>
              <input name="startDate" type="date" required defaultValue={today} className="field" />
            </label>
            <label className="block">
              <span className="label">Selesai</span>
              <input name="endDate" type="date" required defaultValue={today} className="field" />
            </label>
          </div>

          <label className="block">
            <span className="label">Alasan</span>
            <textarea
              name="reason"
              required
              rows={3}
              minLength={6}
              className="field resize-none"
              placeholder="Jelaskan keperluan cuti secara singkat"
            />
          </label>

          {state.error && (
            <p className="text-xs" style={{ color: 'var(--color-clay-500)' }}>
              {state.error}
            </p>
          )}

          <div
            className="-mx-5 -mb-4 flex justify-end gap-2 border-t px-5 py-3"
            style={{ borderColor: 'var(--hairline)' }}
          >
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
              Batal
            </button>
            <SubmitButton className="btn btn-primary btn-sm" pendingLabel="Mengirim…">
              Kirim pengajuan
            </SubmitButton>
          </div>
        </form>
      </Modal>
      <Toast state={state.ok ? state : null} />
    </>
  );
}
