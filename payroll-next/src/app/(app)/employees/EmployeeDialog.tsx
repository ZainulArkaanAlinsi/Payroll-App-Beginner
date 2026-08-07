'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, SquarePen } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { SubmitButton, Toast } from '@/components/ui/Feedback';
import { saveEmployee } from '@/actions/employees';
import type { ActionState } from '@/lib/types';
import { PTKP_LABEL } from '@/lib/tax';
import { rupiah } from '@/lib/format';

export interface EmployeeFormData {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  nik: string | null;
  npwp: string | null;
  gender: string | null;
  address: string | null;
  departmentId: string | null;
  positionId: string | null;
  joinDate: string;
  employmentType: string;
  status: string;
  baseSalary: number;
  ptkpStatus: string;
  bankName: string | null;
  bankAccount: string | null;
  annualLeaveQuota: number;
  enrollBpjsKes: boolean;
  enrollBpjsTk: boolean;
}

export default function EmployeeDialog({
  employee,
  departments,
  positions,
  trigger = 'button',
}: {
  employee?: EmployeeFormData;
  departments: { id: string; name: string }[];
  positions: { id: string; title: string; departmentId: string; minSalary: number; maxSalary: number }[];
  trigger?: 'button' | 'icon';
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(saveEmployee, {});
  const [deptId, setDeptId] = useState(employee?.departmentId ?? '');
  const [posId, setPosId] = useState(employee?.positionId ?? '');
  const router = useRouter();

  // tutup dialog begitu simpan berhasil
  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  const posisiTerpilih = positions.find((p) => p.id === posId);
  const posisiTersedia = deptId ? positions.filter((p) => p.departmentId === deptId) : positions;

  return (
    <>
      {trigger === 'button' ? (
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
          <Plus size={14} />
          Karyawan baru
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setOpen(true)}
          aria-label="Ubah data karyawan"
        >
          <SquarePen size={13} />
          Ubah
        </button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        wide
        title={employee ? `Ubah data ${employee.fullName}` : 'Tambah karyawan baru'}
        description={
          employee
            ? 'Perubahan gaji baru berlaku setelah payroll dihitung ulang.'
            : 'Akun login otomatis dibuat dengan kata sandi awal password123.'
        }
      >
        <form action={action} id="employee-form" className="space-y-5">
          {employee && <input type="hidden" name="id" value={employee.id} />}

          <Fieldset title="Identitas">
            <Field label="Nama lengkap" required span2>
              <input name="fullName" required defaultValue={employee?.fullName} className="field" />
            </Field>
            <Field label="Surel" required>
              <input name="email" type="email" required defaultValue={employee?.email} className="field" />
            </Field>
            <Field label="Telepon">
              <input name="phone" defaultValue={employee?.phone ?? ''} className="field" placeholder="08xx" />
            </Field>
            <Field label="NIK KTP">
              <input name="nik" defaultValue={employee?.nik ?? ''} className="field" />
            </Field>
            <Field label="NPWP" hint="Tanpa NPWP, PPh 21 dikenakan 20% lebih tinggi">
              <input name="npwp" defaultValue={employee?.npwp ?? ''} className="field" />
            </Field>
            <Field label="Jenis kelamin">
              <select name="gender" defaultValue={employee?.gender ?? ''} className="field">
                <option value="">—</option>
                <option value="M">Laki-laki</option>
                <option value="F">Perempuan</option>
              </select>
            </Field>
            <Field label="Alamat" span2>
              <input name="address" defaultValue={employee?.address ?? ''} className="field" />
            </Field>
          </Fieldset>

          <Fieldset title="Penempatan">
            <Field label="Departemen">
              <select
                name="departmentId"
                value={deptId}
                onChange={(e) => {
                  setDeptId(e.target.value);
                  setPosId('');
                }}
                className="field"
              >
                <option value="">—</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Posisi">
              <select
                name="positionId"
                value={posId}
                onChange={(e) => setPosId(e.target.value)}
                className="field"
              >
                <option value="">—</option>
                {posisiTersedia.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tanggal bergabung" required>
              <input
                name="joinDate"
                type="date"
                required
                defaultValue={employee?.joinDate ?? new Date().toISOString().slice(0, 10)}
                className="field"
              />
            </Field>
            <Field label="Jenis hubungan kerja">
              <select name="employmentType" defaultValue={employee?.employmentType ?? 'PERMANENT'} className="field">
                <option value="PERMANENT">Karyawan tetap</option>
                <option value="CONTRACT">Kontrak (PKWT)</option>
                <option value="PROBATION">Masa percobaan</option>
                <option value="INTERN">Magang</option>
              </select>
            </Field>
            <Field label="Status">
              <select name="status" defaultValue={employee?.status ?? 'ACTIVE'} className="field">
                <option value="ACTIVE">Aktif</option>
                <option value="ON_LEAVE">Sedang cuti panjang</option>
                <option value="RESIGNED">Mengundurkan diri</option>
                <option value="TERMINATED">Diberhentikan</option>
              </select>
            </Field>
            <Field label="Kuota cuti tahunan (hari)">
              <input
                name="annualLeaveQuota"
                type="number"
                min={0}
                max={60}
                defaultValue={employee?.annualLeaveQuota ?? 12}
                className="field"
              />
            </Field>
          </Fieldset>

          <Fieldset title="Kompensasi & pajak">
            <Field
              label="Gaji pokok per bulan"
              required
              hint={
                posisiTerpilih && posisiTerpilih.maxSalary > 0
                  ? `Rentang posisi: ${rupiah(posisiTerpilih.minSalary)} – ${rupiah(posisiTerpilih.maxSalary)}`
                  : undefined
              }
            >
              <input
                name="baseSalary"
                type="number"
                min={0}
                step={100000}
                required
                defaultValue={employee?.baseSalary ?? 0}
                className="field tnum"
              />
            </Field>
            <Field label="Status PTKP" hint="Menentukan kategori tarif TER">
              <select name="ptkpStatus" defaultValue={employee?.ptkpStatus ?? 'TK/0'} className="field">
                {Object.entries(PTKP_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Bank">
              <input name="bankName" defaultValue={employee?.bankName ?? ''} className="field" placeholder="BCA" />
            </Field>
            <Field label="Nomor rekening">
              <input name="bankAccount" defaultValue={employee?.bankAccount ?? ''} className="field tnum" />
            </Field>

            <div className="col-span-full flex flex-wrap gap-5 pt-1">
              <Checkbox name="enrollBpjsKes" defaultChecked={employee?.enrollBpjsKes ?? true}>
                Ikut BPJS Kesehatan
              </Checkbox>
              <Checkbox name="enrollBpjsTk" defaultChecked={employee?.enrollBpjsTk ?? true}>
                Ikut BPJS Ketenagakerjaan
              </Checkbox>
            </div>
          </Fieldset>

          <div
            className="-mx-5 -mb-4 flex items-center justify-end gap-2 border-t px-5 py-3"
            style={{ borderColor: 'var(--hairline)' }}
          >
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
              Batal
            </button>
            <SubmitButton className="btn btn-primary btn-sm">
              {employee ? 'Simpan perubahan' : 'Tambah karyawan'}
            </SubmitButton>
          </div>
        </form>
      </Modal>

      <Toast state={state.ok ? state : state.error ? state : null} />
    </>
  );
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="label !mb-2.5">{title}</legend>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  children,
  required,
  hint,
  span2,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
  span2?: boolean;
}) {
  return (
    <label className={span2 ? 'sm:col-span-2' : undefined}>
      <span className="mb-1 block t-label font-medium" style={{ color: 'var(--text-body)' }}>
        {label}
        {required && <span style={{ color: 'var(--color-clay-500)' }}> *</span>}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block t-micro" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </span>
      )}
    </label>
  );
}

function Checkbox({
  name,
  defaultChecked,
  children,
}: {
  name: string;
  defaultChecked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 t-small">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 rounded"
        style={{ accentColor: 'var(--color-jade-600)' }}
      />
      {children}
    </label>
  );
}
