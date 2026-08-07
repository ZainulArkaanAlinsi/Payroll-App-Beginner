'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, CircleDashed, Lock, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { ActionButton, Toast } from '@/components/ui/Feedback';
import { Chip } from '@/components/ui/Glass';
import { decideRunStep } from '@/actions/payroll';
import { sejak } from '@/lib/format';
import type { ActionState } from '@/lib/types';
import type { Role } from '@/lib/auth';

export interface StepView {
  id: string;
  name: string;
  role: string;
  note: string | null;
  decision: 'APPROVED' | 'REJECTED' | null;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
}

export default function ApprovalChain({
  runId,
  steps,
  role,
  runStatus,
}: {
  runId: string;
  steps: StepView[];
  role: Role;
  runStatus: string;
}) {
  const [tolak, setTolak] = useState<StepView | null>(null);
  const [catatan, setCatatan] = useState('');
  const [hasil, setHasil] = useState<ActionState | null>(null);
  const router = useRouter();

  // Tahap berjalan adalah tahap pertama yang belum disetujui.
  const indeksBerjalan = steps.findIndex((s) => s.decision !== 'APPROVED');
  const dapatMemutuskan = (s: StepView, i: number) =>
    runStatus === 'CALCULATED' &&
    i === indeksBerjalan &&
    (role === 'ADMIN' || role === s.role);

  return (
    <>
      <ol className="relative space-y-2 pl-6">
        <span
          className="absolute top-4 bottom-4 left-[9px] w-px"
          style={{ background: 'var(--hairline)' }}
          aria-hidden
        />

        {steps.map((s, i) => {
          const selesai = s.decision === 'APPROVED';
          const ditolak = s.decision === 'REJECTED';
          const berjalan = i === indeksBerjalan && runStatus === 'CALCULATED';
          const bisa = dapatMemutuskan(s, i);

          return (
            <li key={s.id} className="relative">
              <span
                className="absolute top-3.5 -left-6 grid size-[19px] place-items-center rounded-full"
                style={{
                  background: selesai
                    ? 'var(--color-jade-500)'
                    : ditolak
                      ? 'var(--color-clay-500)'
                      : 'var(--field-bg)',
                  color: selesai || ditolak ? '#fff' : 'var(--text-muted)',
                  border: '2px solid var(--bg-base)',
                }}
              >
                {selesai ? (
                  <Check size={11} />
                ) : ditolak ? (
                  <X size={11} />
                ) : berjalan ? (
                  <CircleDashed size={11} />
                ) : (
                  <Lock size={10} />
                )}
              </span>

              <div
                className="glass-thin flex flex-wrap items-center gap-3 px-4 py-3"
                style={{
                  borderColor: berjalan
                    ? 'color-mix(in srgb, var(--accent) 35%, transparent)'
                    : undefined,
                  opacity: !selesai && !ditolak && !berjalan ? 0.65 : 1,
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="t-heading">{s.name}</span>
                    <Chip tone={s.role === 'ADMIN' ? 'jade' : 'info'}>
                      {s.role === 'ADMIN' ? 'Administrator' : 'HRD'}
                    </Chip>
                    {selesai && <Chip tone="jade">disetujui</Chip>}
                    {ditolak && <Chip tone="clay">ditolak</Chip>}
                    {berjalan && !selesai && !ditolak && <Chip tone="brass">menunggu</Chip>}
                  </div>

                  {s.decidedBy ? (
                    <p className="t-micro mt-0.5">
                      {s.decidedBy} · {s.decidedAt ? sejak(s.decidedAt) : ''}
                      {s.decisionNote && ` · ${s.decisionNote}`}
                    </p>
                  ) : (
                    s.note && <p className="t-micro mt-0.5">{s.note}</p>
                  )}
                </div>

                {bisa && (
                  <div className="flex shrink-0 gap-1.5">
                    <ActionButton
                      action={decideRunStep.bind(null, runId, s.id, 'APPROVED', undefined)}
                      className="btn btn-primary btn-sm"
                    >
                      <Check size={13} />
                      Setujui
                    </ActionButton>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        setCatatan('');
                        setTolak(s);
                      }}
                    >
                      <X size={13} />
                      Tolak
                    </button>
                  </div>
                )}

                {berjalan && !bisa && (
                  <span className="t-micro shrink-0">
                    menunggu {s.role === 'ADMIN' ? 'administrator' : 'HRD'}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {tolak && (
        <Modal
          open
          onClose={() => setTolak(null)}
          title={`Tolak pada tahap ${tolak.name}`}
          description="Menolak akan menghapus persetujuan tahap sebelumnya — setelah diperbaiki, alurnya diulang dari awal."
        >
          <label className="block">
            <span className="label">Alasan penolakan</span>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              className="field resize-none"
              placeholder="mis. lembur Divisi Teknologi belum diverifikasi"
            />
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTolak(null)}>
              Batal
            </button>
            <ActionButton
              action={async () => {
                const s = await decideRunStep(runId, tolak.id, 'REJECTED', catatan.trim() || undefined);
                setTolak(null);
                setHasil(s);
                router.refresh();
                return s;
              }}
              className="btn btn-danger btn-sm"
            >
              Tolak periode ini
            </ActionButton>
          </div>
        </Modal>
      )}

      <Toast state={hasil} onDismiss={() => setHasil(null)} />
    </>
  );
}
