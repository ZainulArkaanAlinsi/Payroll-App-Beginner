'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Plus, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { ActionButton, SubmitButton, Toast } from '@/components/ui/Feedback';
import { reviewOvertime, submitOvertime } from '@/actions/requests';
import type { ActionState } from '@/lib/types';
import { overtimePay } from '@/lib/payroll-engine';
import { rupiah } from '@/lib/format';

export function ReviewOvertime({ id, name, estimate }: { id: string; name: string; estimate: string }) {
  return (
    <div className="flex gap-1.5">
      <ActionButton
        action={reviewOvertime.bind(null, id, 'APPROVED')}
        className="btn btn-primary btn-sm"
        confirm={`Setujui lembur ${name}? Nilai ${estimate} akan dikunci dan masuk ke perhitungan gaji periode terkait.`}
      >
        <Check size={13} />
        Setujui
      </ActionButton>
      <ActionButton
        action={reviewOvertime.bind(null, id, 'REJECTED')}
        className="btn btn-danger btn-sm"
        confirm={`Tolak pengajuan lembur ${name}?`}
      >
        <X size={13} />
        Tolak
      </ActionButton>
    </div>
  );
}

export function OvertimeDialog({
  employees,
  fixedEmployeeId,
  baseSalary,
  label = 'Ajukan lembur',
}: {
  employees?: { id: string; fullName: string; employeeNo: string; baseSalary: number }[];
  fixedEmployeeId?: string;
  baseSalary?: number;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(submitOvertime, {});
  const [empId, setEmpId] = useState(fixedEmployeeId ?? '');
  const [hours, setHours] = useState(2);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  // pratinjau memakai rumus yang sama dengan mesin gaji
  const upah = baseSalary ?? employees?.find((e) => e.id === empId)?.baseSalary ?? 0;
  const hariLibur = date ? [0, 6].includes(new Date(date).getDay()) : false;
  const perkiraan = upah
    ? overtimePay(upah, hariLibur ? 0 : hours, hariLibur ? hours : 0).amount
    : 0;

  return (
    <>
      <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
        <Plus size={14} />
        {label}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Ajukan lembur"
        description="Upah lembur mengikuti Kepmenaker 102/2004: upah sejam = 1/173 upah sebulan."
      >
        <form action={action} className="space-y-4">
          {fixedEmployeeId ? (
            <input type="hidden" name="employeeId" value={fixedEmployeeId} />
          ) : (
            <label className="block">
              <span className="label">Karyawan</span>
              <select
                name="employeeId"
                required
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                className="field"
              >
                <option value="">Pilih karyawan…</option>
                {employees?.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.employeeNo} — {e.fullName}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">Tanggal</span>
              <input
                name="date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="field"
              />
            </label>
            <label className="block">
              <span className="label">Jumlah jam</span>
              <input
                name="hours"
                type="number"
                min={0.5}
                max={12}
                step={0.5}
                required
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="field tnum"
              />
            </label>
          </div>

          {upah > 0 && (
            <div className="glass-thin px-3.5 py-2.5">
              <div className="flex items-baseline justify-between">
                <span className="t-small">
                  Perkiraan upah lembur
                  {hariLibur && (
                    <span className="block t-micro" style={{ color: 'var(--color-brass-500)' }}>
                      hari libur — pengganda 2× hingga 4×
                    </span>
                  )}
                </span>
                <span className="tnum t-body font-semibold" style={{ color: 'var(--text-strong)' }}>
                  {rupiah(perkiraan)}
                </span>
              </div>
            </div>
          )}

          <label className="block">
            <span className="label">Alasan lembur</span>
            <textarea
              name="reason"
              required
              rows={3}
              minLength={6}
              className="field resize-none"
              placeholder="mis. menyelesaikan rilis fitur ke produksi"
            />
          </label>

          {state.error && (
            <p className="t-label" style={{ color: 'var(--color-clay-500)' }}>
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
