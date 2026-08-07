'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, SquarePen } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { SubmitButton, Toast } from '@/components/ui/Feedback';
import { saveDepartment, savePosition } from '@/actions/org';
import type { ActionState } from '@/lib/types';

const LEVEL = [
  ['INTERN', 'Magang'],
  ['STAFF', 'Staf'],
  ['SENIOR', 'Senior'],
  ['LEAD', 'Lead'],
  ['MANAGER', 'Manajer'],
  ['DIRECTOR', 'Direktur'],
];

export function DepartmentDialog({
  department,
}: {
  department?: { id: string; code: string; name: string; costCenter: string | null };
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(saveDepartment, {});
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <>
      <button
        type="button"
        className={department ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}
        onClick={() => setOpen(true)}
      >
        {department ? <SquarePen size={13} /> : <Plus size={14} />}
        {department ? 'Ubah' : 'Departemen baru'}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={department ? `Ubah ${department.name}` : 'Tambah departemen'}
      >
        <form action={action} className="space-y-4">
          {department && <input type="hidden" name="id" value={department.id} />}
          <label className="block">
            <span className="label">Kode</span>
            <input
              name="code"
              required
              maxLength={8}
              defaultValue={department?.code}
              className="field uppercase"
              placeholder="ENG"
            />
          </label>
          <label className="block">
            <span className="label">Nama departemen</span>
            <input name="name" required defaultValue={department?.name} className="field" />
          </label>
          <label className="block">
            <span className="label">Pusat biaya (opsional)</span>
            <input
              name="costCenter"
              defaultValue={department?.costCenter ?? ''}
              className="field"
              placeholder="CC-100"
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
            <SubmitButton className="btn btn-primary btn-sm">Simpan</SubmitButton>
          </div>
        </form>
      </Modal>
      <Toast state={state.ok ? state : null} />
    </>
  );
}

export function PositionDialog({
  departments,
  position,
  defaultDepartmentId,
}: {
  departments: { id: string; name: string }[];
  position?: {
    id: string;
    title: string;
    level: string;
    departmentId: string;
    minSalary: number;
    maxSalary: number;
  };
  defaultDepartmentId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(savePosition, {});
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <>
      <button
        type="button"
        className={position ? 'btn btn-ghost btn-sm' : 'btn btn-ghost btn-sm'}
        onClick={() => setOpen(true)}
      >
        {position ? <SquarePen size={13} /> : <Plus size={13} />}
        {position ? 'Ubah' : 'Posisi'}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={position ? `Ubah ${position.title}` : 'Tambah posisi'}
        description="Rentang gaji dipakai sebagai rambu saat mengisi gaji karyawan."
      >
        <form action={action} className="space-y-4">
          {position && <input type="hidden" name="id" value={position.id} />}
          <label className="block">
            <span className="label">Nama jabatan</span>
            <input name="title" required defaultValue={position?.title} className="field" />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">Departemen</span>
              <select
                name="departmentId"
                required
                defaultValue={position?.departmentId ?? defaultDepartmentId ?? ''}
                className="field"
              >
                <option value="">Pilih…</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Tingkat</span>
              <select name="level" defaultValue={position?.level ?? 'STAFF'} className="field">
                {LEVEL.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Gaji minimum</span>
              <input
                name="minSalary"
                type="number"
                min={0}
                step={500000}
                defaultValue={position?.minSalary ?? 0}
                className="field tnum"
              />
            </label>
            <label className="block">
              <span className="label">Gaji maksimum</span>
              <input
                name="maxSalary"
                type="number"
                min={0}
                step={500000}
                defaultValue={position?.maxSalary ?? 0}
                className="field tnum"
              />
            </label>
          </div>

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
            <SubmitButton className="btn btn-primary btn-sm">Simpan</SubmitButton>
          </div>
        </form>
      </Modal>
      <Toast state={state.ok ? state : null} />
    </>
  );
}
