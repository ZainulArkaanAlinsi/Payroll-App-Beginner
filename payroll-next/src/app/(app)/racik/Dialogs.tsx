'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, SquarePen, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { SubmitButton, Toast } from '@/components/ui/Feedback';
import { savePolicy, saveStep, saveBankFormat } from '@/actions/racik';
import type { ActionState } from '@/lib/types';
import { LEVEL_PILIHAN } from '@/lib/policy';
import { rupiah } from '@/lib/format';

// ─────────────────────────── Aturan divisi ───────────────────────────

export interface PolicyForm {
  id: string;
  name: string;
  kind: string;
  priority: number;
  active: boolean;
  scopeDepartmentId: string | null;
  scopeLevel: string | null;
  config: string;
}

export function PolicyDialog({
  departments,
  policy,
  defaultKind = 'LATE',
}: {
  departments: { id: string; name: string }[];
  policy?: PolicyForm;
  defaultKind?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(savePolicy, {});
  const [kind, setKind] = useState(policy?.kind ?? defaultKind);
  const [metode, setMetode] = useState('KEPMENAKER');
  const router = useRouter();

  const cfg = (() => {
    try {
      return policy ? JSON.parse(policy.config) : {};
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    if (policy && cfg.metode) setMetode(cfg.metode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policy]);

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
        className={policy ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}
        onClick={() => setOpen(true)}
      >
        {policy ? <SquarePen size={13} /> : <Plus size={14} />}
        {policy ? 'Ubah' : 'Aturan baru'}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={policy ? `Ubah ${policy.name}` : 'Tambah aturan divisi'}
        description="Aturan paling spesifik menang. Aturan bertingkat jabatan mengalahkan aturan berdepartemen, dan keduanya mengalahkan aturan umum."
      >
        <form action={action} className="space-y-4">
          {policy && <input type="hidden" name="id" value={policy.id} />}

          <label className="block">
            <span className="label">Nama aturan</span>
            <input
              name="name"
              required
              defaultValue={policy?.name}
              className="field"
              placeholder="mis. Keterlambatan — Operasional lebih ketat"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">Jenis</span>
              <select
                name="kind"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="field"
                disabled={Boolean(policy)}
              >
                <option value="LATE">Keterlambatan</option>
                <option value="OVERTIME">Lembur</option>
              </select>
            </label>
            <label className="block">
              <span className="label">Prioritas</span>
              <input
                name="priority"
                type="number"
                min={0}
                max={999}
                defaultValue={policy?.priority ?? 0}
                className="field tnum"
              />
              <span className="t-micro mt-1 block">Dipakai bila dua aturan sama spesifiknya.</span>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">Berlaku di departemen</span>
              <select
                name="scopeDepartmentId"
                defaultValue={policy?.scopeDepartmentId ?? ''}
                className="field"
              >
                <option value="">Semua departemen</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Berlaku untuk tingkat</span>
              <select name="scopeLevel" defaultValue={policy?.scopeLevel ?? ''} className="field">
                <option value="">Semua tingkat</option>
                {LEVEL_PILIHAN.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {kind === 'LATE' ? (
            <div className="glass-thin space-y-3 px-4 py-3.5">
              <p className="label !mb-0">Ketentuan keterlambatan</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="label">Toleransi (menit)</span>
                  <input
                    name="toleransiMenit"
                    type="number"
                    min={0}
                    defaultValue={cfg.toleransiMenit ?? 15}
                    className="field tnum"
                  />
                </label>
                <label className="block">
                  <span className="label">Potongan per menit</span>
                  <input
                    name="potonganPerMenit"
                    type="number"
                    min={0}
                    step={500}
                    defaultValue={cfg.potonganPerMenit ?? 0}
                    className="field tnum"
                  />
                </label>
                <label className="block">
                  <span className="label">Maksimal per bulan</span>
                  <input
                    name="potonganMaksPerBulan"
                    type="number"
                    min={0}
                    step={50000}
                    defaultValue={cfg.potonganMaksPerBulan ?? 0}
                    className="field tnum"
                  />
                  <span className="t-micro mt-1 block">0 berarti tanpa batas atas.</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="glass-thin space-y-3 px-4 py-3.5">
              <p className="label !mb-0">Ketentuan lembur</p>
              <label className="block">
                <span className="label">Metode</span>
                <select
                  name="metode"
                  value={metode}
                  onChange={(e) => setMetode(e.target.value)}
                  className="field"
                >
                  <option value="KEPMENAKER">Kepmenaker — pengganda 1,5× / 2× / 3× / 4×</option>
                  <option value="FLAT">Tarif rata per jam</option>
                </select>
              </label>

              {metode === 'FLAT' ? (
                <label className="block">
                  <span className="label">Tarif per jam</span>
                  <input
                    name="tarifPerJam"
                    type="number"
                    min={0}
                    step={5000}
                    defaultValue={cfg.tarifPerJam ?? 50000}
                    className="field tnum"
                  />
                </label>
              ) : (
                <label className="block">
                  <span className="label">Pembagi upah sejam</span>
                  <input
                    name="pembagi"
                    type="number"
                    min={1}
                    defaultValue={cfg.pembagi ?? 173}
                    className="field tnum"
                  />
                  <span className="t-micro mt-1 block">
                    Ketentuan resmi memakai 173 — upah sebulan dibagi 173 jam.
                  </span>
                </label>
              )}
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2 t-small">
            <input
              type="checkbox"
              name="active"
              defaultChecked={policy?.active ?? true}
              className="size-4 rounded"
              style={{ accentColor: 'var(--color-jade-600)' }}
            />
            Aturan aktif
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
            <SubmitButton className="btn btn-primary btn-sm">Simpan aturan</SubmitButton>
          </div>
        </form>
      </Modal>
      <Toast state={state.ok ? state : null} />
    </>
  );
}

// ───────────────────────── Tahap persetujuan ─────────────────────────

export function StepDialog({
  step,
}: {
  step?: { id: string; name: string; role: string; note: string | null; active: boolean };
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(saveStep, {});
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
        className={step ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}
        onClick={() => setOpen(true)}
      >
        {step ? <SquarePen size={13} /> : <Plus size={14} />}
        {step ? 'Ubah' : 'Tambah tahap'}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={step ? `Ubah tahap ${step.name}` : 'Tambah tahap persetujuan'}
        description="Tahap baru ditempatkan di akhir alur; urutannya bisa digeser setelah dibuat."
      >
        <form action={action} className="space-y-4">
          {step && <input type="hidden" name="id" value={step.id} />}

          <label className="block">
            <span className="label">Nama tahap</span>
            <input
              name="name"
              required
              defaultValue={step?.name}
              className="field"
              placeholder="mis. Disetujui Manajer HR"
            />
          </label>

          <label className="block">
            <span className="label">Diputuskan oleh</span>
            <select name="role" defaultValue={step?.role ?? 'HR'} className="field">
              <option value="HR">HRD</option>
              <option value="ADMIN">Administrator</option>
            </select>
            <span className="t-micro mt-1 block">
              Administrator selalu bisa memutuskan tahap mana pun.
            </span>
          </label>

          <label className="block">
            <span className="label">Keterangan (opsional)</span>
            <input
              name="note"
              defaultValue={step?.note ?? ''}
              className="field"
              placeholder="Apa yang diperiksa pada tahap ini"
            />
          </label>

          <label className="flex cursor-pointer items-center gap-2 t-small">
            <input
              type="checkbox"
              name="active"
              defaultChecked={step?.active ?? true}
              className="size-4 rounded"
              style={{ accentColor: 'var(--color-jade-600)' }}
            />
            Tahap aktif
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
            <SubmitButton className="btn btn-primary btn-sm">Simpan tahap</SubmitButton>
          </div>
        </form>
      </Modal>
      <Toast state={state.ok ? state : null} />
    </>
  );
}

// ─────────────────────────── Format bank ───────────────────────────

const SUMBER = [
  ['rowNumber', 'Nomor urut baris'],
  ['employeeNo', 'Nomor induk karyawan'],
  ['fullName', 'Nama lengkap'],
  ['bankHolder', 'Nama pemilik rekening'],
  ['bankName', 'Nama bank'],
  ['bankAccount', 'Nomor rekening'],
  ['netPay', 'Gaji bersih'],
  ['grossPay', 'Penghasilan bruto'],
  ['period', 'Periode gaji'],
  ['department', 'Departemen'],
] as const;

interface Kolom {
  header: string;
  source: string;
  prefix: string;
}

export function BankDialog({
  format,
}: {
  format?: {
    id: string;
    name: string;
    delimiter: string;
    includeHeader: boolean;
    isDefault: boolean;
    columns: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(saveBankFormat, {});
  const router = useRouter();

  const awal: Kolom[] = (() => {
    if (!format) return [{ header: 'Nomor Rekening', source: 'bankAccount', prefix: "'" }];
    try {
      return JSON.parse(format.columns) as Kolom[];
    } catch {
      return [];
    }
  })();
  const [kolom, setKolom] = useState<Kolom[]>(awal);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  const ubah = (i: number, patch: Partial<Kolom>) =>
    setKolom((k) => k.map((c, n) => (n === i ? { ...c, ...patch } : c)));

  const geser = (i: number, arah: -1 | 1) =>
    setKolom((k) => {
      const j = i + arah;
      if (j < 0 || j >= k.length) return k;
      const next = [...k];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <>
      <button
        type="button"
        className={format ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}
        onClick={() => setOpen(true)}
      >
        {format ? <SquarePen size={13} /> : <Plus size={14} />}
        {format ? 'Ubah' : 'Format baru'}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        wide
        title={format ? `Ubah ${format.name}` : 'Tambah format transfer bank'}
        description="Susun kolomnya persis seperti yang diminta bank, sehingga berkasnya bisa langsung diunggah tanpa disunting ulang."
      >
        <form action={action} className="space-y-4">
          {format && <input type="hidden" name="id" value={format.id} />}

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block sm:col-span-2">
              <span className="label">Nama format</span>
              <input
                name="name"
                required
                defaultValue={format?.name}
                className="field"
                placeholder="mis. BCA — Mass Transfer"
              />
            </label>
            <label className="block">
              <span className="label">Pemisah kolom</span>
              <select name="delimiter" defaultValue={format?.delimiter ?? ';'} className="field">
                <option value=";">Titik koma ( ; )</option>
                <option value=",">Koma ( , )</option>
                <option value="|">Garis tegak ( | )</option>
              </select>
            </label>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="label !mb-0">Susunan kolom</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setKolom((k) => [...k, { header: '', source: 'netPay', prefix: '' }])}
              >
                <Plus size={13} />
                Tambah kolom
              </button>
            </div>

            <ul className="space-y-2">
              {kolom.map((c, i) => (
                <li key={i} className="glass-thin flex flex-wrap items-end gap-2 px-3 py-2.5">
                  <span className="tnum t-micro w-5 shrink-0 pb-2 text-center">{i + 1}</span>

                  <label className="min-w-[9rem] flex-1">
                    <span className="label">Judul kolom</span>
                    <input
                      name="colHeader"
                      value={c.header}
                      onChange={(e) => ubah(i, { header: e.target.value })}
                      className="field"
                      placeholder="NOREK"
                    />
                  </label>

                  <label className="min-w-[10rem] flex-1">
                    <span className="label">Isi dari</span>
                    <select
                      name="colSource"
                      value={c.source}
                      onChange={(e) => ubah(i, { source: e.target.value })}
                      className="field"
                    >
                      {SUMBER.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="w-24">
                    <span className="label">Awalan</span>
                    <input
                      name="colPrefix"
                      value={c.prefix}
                      onChange={(e) => ubah(i, { prefix: e.target.value })}
                      className="field"
                      placeholder="'"
                    />
                  </label>

                  <span className="flex gap-1 pb-1">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ width: 28, paddingInline: 0 }}
                      onClick={() => geser(i, -1)}
                      aria-label="Naikkan kolom"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ width: 28, paddingInline: 0 }}
                      onClick={() => geser(i, 1)}
                      aria-label="Turunkan kolom"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      style={{ width: 28, paddingInline: 0 }}
                      onClick={() => setKolom((k) => k.filter((_, n) => n !== i))}
                      aria-label="Hapus kolom"
                    >
                      <Trash2 size={12} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>

            <p className="t-micro mt-2">
              Awalan tanda kutip (&apos;) menjaga nol di depan nomor rekening agar tidak hilang saat
              berkas dibuka di Excel.
            </p>
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="flex cursor-pointer items-center gap-2 t-small">
              <input
                type="checkbox"
                name="includeHeader"
                defaultChecked={format?.includeHeader ?? true}
                className="size-4 rounded"
                style={{ accentColor: 'var(--color-jade-600)' }}
              />
              Sertakan baris judul kolom
            </label>
            <label className="flex cursor-pointer items-center gap-2 t-small">
              <input
                type="checkbox"
                name="isDefault"
                defaultChecked={format?.isDefault ?? false}
                className="size-4 rounded"
                style={{ accentColor: 'var(--color-jade-600)' }}
              />
              Jadikan format bawaan
            </label>
          </div>

          {state.error && (
            <p className="t-label" style={{ color: 'var(--color-clay-500)' }}>
              {state.error}
            </p>
          )}

          <div
            className="-mx-5 -mb-4 flex items-center justify-between gap-2 border-t px-5 py-3"
            style={{ borderColor: 'var(--hairline)' }}
          >
            <span className="t-micro">Contoh nominal: {rupiah(7_118_526)}</span>
            <span className="flex gap-2">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
                Batal
              </button>
              <SubmitButton className="btn btn-primary btn-sm">Simpan format</SubmitButton>
            </span>
          </div>
        </form>
      </Modal>
      <Toast state={state.ok ? state : null} />
    </>
  );
}
