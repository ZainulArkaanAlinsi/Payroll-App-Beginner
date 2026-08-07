'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HandCoins, Plus, SquarePen } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { SubmitButton, Toast } from '@/components/ui/Feedback';
import { saveComponent, saveLoan } from '@/actions/compensation';
import type { ActionState } from '@/lib/types';
import { rupiah } from '@/lib/format';

export interface ComponentRow {
  id: string;
  code: string;
  name: string;
  type: string;
  calcType: string;
  amount: number;
  percent: number;
  taxable: boolean;
  isDefault: boolean;
  active: boolean;
  note: string | null;
}

export function ComponentDialog({ component }: { component?: ComponentRow }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(saveComponent, {});
  const [calcType, setCalcType] = useState(component?.calcType ?? 'FIXED');
  const [type, setType] = useState(component?.type ?? 'ALLOWANCE');
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
        className={component ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}
        onClick={() => setOpen(true)}
      >
        {component ? <SquarePen size={13} /> : <Plus size={14} />}
        {component ? 'Ubah' : 'Komponen baru'}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={component ? `Ubah ${component.name}` : 'Tambah komponen gaji'}
        description="Perubahan berlaku pada perhitungan payroll berikutnya."
      >
        <form action={action} className="space-y-4">
          {component && <input type="hidden" name="id" value={component.id} />}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">Kode</span>
              <input
                name="code"
                required
                maxLength={12}
                defaultValue={component?.code}
                className="field uppercase"
                placeholder="TJ-TRANS"
              />
            </label>
            <label className="block">
              <span className="label">Jenis</span>
              <select
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="field"
              >
                <option value="ALLOWANCE">Tunjangan (menambah)</option>
                <option value="DEDUCTION">Potongan (mengurangi)</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="label">Nama komponen</span>
            <input name="name" required defaultValue={component?.name} className="field" />
          </label>

          <label className="block">
            <span className="label">Cara hitung</span>
            <select
              name="calcType"
              value={calcType}
              onChange={(e) => setCalcType(e.target.value)}
              className="field"
            >
              <option value="FIXED">Nominal tetap</option>
              <option value="PERCENT_OF_BASE">Persentase dari gaji pokok</option>
            </select>
          </label>

          {calcType === 'FIXED' ? (
            <label className="block">
              <span className="label">Nominal per bulan</span>
              <input
                name="amount"
                type="number"
                min={0}
                step={50000}
                defaultValue={component?.amount ?? 0}
                className="field tnum"
              />
              <input type="hidden" name="percent" value={0} />
            </label>
          ) : (
            <label className="block">
              <span className="label">Persentase gaji pokok</span>
              <input
                name="percent"
                type="number"
                min={0}
                max={100}
                step={0.5}
                defaultValue={component?.percent ?? 0}
                className="field tnum"
              />
              <input type="hidden" name="amount" value={0} />
              <span className="mt-1 block text-[0.6875rem]" style={{ color: 'var(--text-muted)' }}>
                Contoh: 12,5% dari gaji pokok Rp 20.000.000 = {rupiah(2_500_000)}.
              </span>
            </label>
          )}

          <label className="block">
            <span className="label">Catatan (opsional)</span>
            <input name="note" defaultValue={component?.note ?? ''} className="field" />
          </label>

          <div className="space-y-2.5 pt-1">
            {type === 'ALLOWANCE' && (
              <Check name="taxable" defaultChecked={component?.taxable ?? true}>
                Kena pajak
                <span className="block text-[0.6875rem]" style={{ color: 'var(--text-muted)' }}>
                  Tunjangan bebas pajak tidak menambah dasar pengenaan PPh 21.
                </span>
              </Check>
            )}
            {type === 'DEDUCTION' && <input type="hidden" name="taxable" value="" />}
            <Check name="isDefault" defaultChecked={component?.isDefault ?? false}>
              Otomatis diberikan ke karyawan baru
            </Check>
            <Check name="active" defaultChecked={component?.active ?? true}>
              Aktif
            </Check>
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

export function LoanDialog({
  employees,
  currentPeriod,
}: {
  employees: { id: string; fullName: string; employeeNo: string }[];
  currentPeriod: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(saveLoan, {});
  const [principal, setPrincipal] = useState(5_000_000);
  const [tenor, setTenor] = useState(12);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  const cicilan = tenor > 0 ? Math.round(principal / tenor) : 0;

  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        <HandCoins size={14} />
        Catat pinjaman
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Catat pinjaman karyawan"
        description="Cicilan otomatis dipotong tiap periode dan berkurang setelah gaji dibayarkan."
      >
        <form action={action} className="space-y-4">
          <label className="block">
            <span className="label">Karyawan</span>
            <select name="employeeId" required className="field">
              <option value="">Pilih karyawan…</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.employeeNo} — {e.fullName}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">Pokok pinjaman</span>
              <input
                name="principal"
                type="number"
                min={100000}
                step={500000}
                required
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="field tnum"
              />
            </label>
            <label className="block">
              <span className="label">Tenor (bulan)</span>
              <input
                name="tenorMonths"
                type="number"
                min={1}
                max={60}
                required
                value={tenor}
                onChange={(e) => setTenor(Number(e.target.value))}
                className="field tnum"
              />
            </label>
          </div>

          <label className="block">
            <span className="label">Mulai dipotong</span>
            <input
              name="startPeriod"
              type="month"
              required
              defaultValue={currentPeriod}
              className="field"
            />
          </label>

          <div className="glass-thin flex items-baseline justify-between px-3.5 py-2.5">
            <span className="text-[0.8125rem]">Potongan per bulan</span>
            <span className="tnum text-sm font-semibold" style={{ color: 'var(--text-strong)' }}>
              {rupiah(cicilan)}
            </span>
          </div>

          <label className="block">
            <span className="label">Keterangan (opsional)</span>
            <input name="note" className="field" placeholder="mis. renovasi rumah" />
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
            <SubmitButton className="btn btn-primary btn-sm">Catat pinjaman</SubmitButton>
          </div>
        </form>
      </Modal>
      <Toast state={state.ok ? state : null} />
    </>
  );
}

function Check({
  name,
  defaultChecked,
  children,
}: {
  name: string;
  defaultChecked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-[0.8125rem]">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 shrink-0 rounded"
        style={{ accentColor: 'var(--color-jade-600)' }}
      />
      <span>{children}</span>
    </label>
  );
}
