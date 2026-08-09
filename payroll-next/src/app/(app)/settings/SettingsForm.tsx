'use client';

import { useActionState, useState } from 'react';
import { Building2, Clock, CreditCard, KeyRound, Percent, Save, Scale, Wallet } from 'lucide-react';
import { SubmitButton, Toast } from '@/components/ui/Feedback';
import { GlassCard, SectionTitle } from '@/components/ui/Glass';
import { KartuBank } from '@/components/ui/KartuBank';
import { changePassword, saveSettings } from '@/actions/settings';
import type { ActionState } from '@/lib/types';

export interface SettingsData {
  name: string;
  legalName: string;
  npwp: string;
  address: string;
  phone: string;
  email: string;
  logoInitials: string;
  payoutBankName: string | null;
  payoutBankAccount: string | null;
  payoutBankHolder: string | null;
  workStart: string;
  workEnd: string;
  workDays: number;
  lateToleranceMin: number;
  payDay: number;
  cutoffDay: number;
  bpjsKesEmployeeRate: number;
  bpjsKesEmployerRate: number;
  bpjsKesCap: number;
  bpjsJhtEmployeeRate: number;
  bpjsJhtEmployerRate: number;
  bpjsJpEmployeeRate: number;
  bpjsJpEmployerRate: number;
  bpjsJpCap: number;
  bpjsJkkRate: number;
  bpjsJkmRate: number;
  lateCutPerMinute: number;
  absentCutPerDay: boolean;
  minimumWage: number;
  minimumWageRegion: string;
  enforceBasicRatio: boolean;
}

export default function SettingsForm({ data, surel }: { data: SettingsData; surel: string }) {
  const [state, action] = useActionState<ActionState, FormData>(saveSettings, {});

  return (
    <>
      <form action={action} className="space-y-4">
        <GlassCard>
          <SectionTitle
            title="Profil perusahaan"
            subtitle="Muncul pada kop slip gaji dan dokumen ekspor"
            action={<Building2 size={15} style={{ color: 'var(--text-muted)' }} />}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Nama singkat">
              <input name="name" required defaultValue={data.name} className="field" />
            </F>
            <F label="Nama badan hukum">
              <input name="legalName" required defaultValue={data.legalName} className="field" />
            </F>
            <F label="NPWP perusahaan">
              <input name="npwp" required defaultValue={data.npwp} className="field tnum" />
            </F>
            <F label="Inisial logo" hint="Maksimal 3 huruf, tampil di slip gaji">
              <input
                name="logoInitials"
                required
                maxLength={3}
                defaultValue={data.logoInitials}
                className="field uppercase"
              />
            </F>
            <F label="Alamat" span2>
              <input name="address" required defaultValue={data.address} className="field" />
            </F>
            <F label="Telepon">
              <input name="phone" defaultValue={data.phone} className="field" />
            </F>
            <F label="Surel">
              <input name="email" type="email" required defaultValue={data.email} className="field" />
            </F>
          </div>
        </GlassCard>

        <RekeningPenyalur data={data} />

        <GlassCard>
          <SectionTitle
            title="Jam kerja & kehadiran"
            subtitle="Dipakai untuk menentukan keterlambatan saat karyawan absen masuk"
            action={<Clock size={15} style={{ color: 'var(--text-muted)' }} />}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <F label="Jam masuk">
              <input name="workStart" type="time" required defaultValue={data.workStart} className="field" />
            </F>
            <F label="Jam pulang">
              <input name="workEnd" type="time" required defaultValue={data.workEnd} className="field" />
            </F>
            <F label="Hari kerja per pekan">
              <input
                name="workDays"
                type="number"
                min={1}
                max={7}
                required
                defaultValue={data.workDays}
                className="field tnum"
              />
            </F>
            <F label="Toleransi telat (menit)">
              <input
                name="lateToleranceMin"
                type="number"
                min={0}
                max={120}
                required
                defaultValue={data.lateToleranceMin}
                className="field tnum"
              />
            </F>
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle
            title="Siklus penggajian"
            subtitle="Tanggal bawaan saat membuat proses gaji baru"
            action={<Wallet size={15} style={{ color: 'var(--text-muted)' }} />}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <F label="Tanggal gajian">
              <input
                name="payDay"
                type="number"
                min={1}
                max={31}
                required
                defaultValue={data.payDay}
                className="field tnum"
              />
            </F>
            <F label="Tanggal cutoff">
              <input
                name="cutoffDay"
                type="number"
                min={1}
                max={31}
                required
                defaultValue={data.cutoffDay}
                className="field tnum"
              />
            </F>
            <F label="Potongan telat per menit" hint="Isi 0 untuk menonaktifkan">
              <input
                name="lateCutPerMinute"
                type="number"
                min={0}
                step={500}
                required
                defaultValue={data.lateCutPerMinute}
                className="field tnum"
              />
            </F>
            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2 t-small">
                <input
                  type="checkbox"
                  name="absentCutPerDay"
                  defaultChecked={data.absentCutPerDay}
                  className="size-4 rounded"
                  style={{ accentColor: 'var(--color-jade-600)' }}
                />
                Potong gaji saat mangkir
              </label>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle
            title="Kepatuhan ketenagakerjaan"
            subtitle="Dipakai memeriksa struktur upah karyawan; peringatannya muncul di halaman Karyawan"
            action={<Scale size={15} style={{ color: 'var(--text-muted)' }} />}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Upah minimum berlaku" hint="UMP atau UMK yang berlaku di wilayah perusahaan">
              <input
                name="minimumWage"
                type="number"
                min={0}
                step={50000}
                required
                defaultValue={data.minimumWage}
                className="field tnum"
              />
            </F>
            <F label="Wilayah" hint="Ditampilkan pada peringatan agar jelas acuannya">
              <input
                name="minimumWageRegion"
                required
                defaultValue={data.minimumWageRegion}
                className="field"
                placeholder="DKI Jakarta"
              />
            </F>
            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-start gap-2.5 t-small">
                <input
                  type="checkbox"
                  name="enforceBasicRatio"
                  defaultChecked={data.enforceBasicRatio}
                  className="mt-0.5 size-4 shrink-0 rounded"
                  style={{ accentColor: 'var(--color-jade-600)' }}
                />
                <span>
                  Periksa rasio gaji pokok minimal 75%
                  <span className="block t-micro">
                    PP 36/2021 Pasal 7 ayat 2. Rasio yang terlalu rendah juga mengecilkan dasar
                    pengali BPJS dan perhitungan pesangon.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle
            title="Iuran BPJS"
            subtitle="Tarif dan plafon disimpan sebagai konfigurasi, bukan ditanam di kode — saat regulasi berubah cukup ubah di sini"
            action={<Percent size={15} style={{ color: 'var(--text-muted)' }} />}
          />

          <div className="space-y-4">
            <Grup judul="BPJS Kesehatan">
              <F label="Karyawan (%)">
                <input name="bpjsKesEmployeeRate" type="number" step={0.1} min={0} required defaultValue={data.bpjsKesEmployeeRate} className="field tnum" />
              </F>
              <F label="Perusahaan (%)">
                <input name="bpjsKesEmployerRate" type="number" step={0.1} min={0} required defaultValue={data.bpjsKesEmployerRate} className="field tnum" />
              </F>
              <F label="Plafon upah (Rp)" hint="Upah di atas plafon tidak menambah iuran">
                <input name="bpjsKesCap" type="number" step={100000} min={0} required defaultValue={data.bpjsKesCap} className="field tnum" />
              </F>
            </Grup>

            <Grup judul="Jaminan Hari Tua (JHT)">
              <F label="Karyawan (%)">
                <input name="bpjsJhtEmployeeRate" type="number" step={0.1} min={0} required defaultValue={data.bpjsJhtEmployeeRate} className="field tnum" />
              </F>
              <F label="Perusahaan (%)">
                <input name="bpjsJhtEmployerRate" type="number" step={0.1} min={0} required defaultValue={data.bpjsJhtEmployerRate} className="field tnum" />
              </F>
              <F label="Plafon" hint="JHT tidak berplafon">
                <input disabled value="Tanpa plafon" className="field" />
              </F>
            </Grup>

            <Grup judul="Jaminan Pensiun (JP)">
              <F label="Karyawan (%)">
                <input name="bpjsJpEmployeeRate" type="number" step={0.1} min={0} required defaultValue={data.bpjsJpEmployeeRate} className="field tnum" />
              </F>
              <F label="Perusahaan (%)">
                <input name="bpjsJpEmployerRate" type="number" step={0.1} min={0} required defaultValue={data.bpjsJpEmployerRate} className="field tnum" />
              </F>
              <F label="Plafon upah (Rp)">
                <input name="bpjsJpCap" type="number" step={100000} min={0} required defaultValue={data.bpjsJpCap} className="field tnum" />
              </F>
            </Grup>

            <Grup judul="JKK & JKM — sepenuhnya ditanggung perusahaan">
              <F label="JKK (%)" hint="Bergantung kelompok risiko usaha">
                <input name="bpjsJkkRate" type="number" step={0.01} min={0} required defaultValue={data.bpjsJkkRate} className="field tnum" />
              </F>
              <F label="JKM (%)">
                <input name="bpjsJkmRate" type="number" step={0.01} min={0} required defaultValue={data.bpjsJkmRate} className="field tnum" />
              </F>
              <div />
            </Grup>
          </div>
        </GlassCard>

        <div className="flex justify-end">
          <SubmitButton className="btn btn-primary">
            <Save size={14} />
            Simpan pengaturan
          </SubmitButton>
        </div>
      </form>

      <PasswordCard surel={surel} />

      <Toast state={state.error || state.ok ? state : null} />
    </>
  );
}

function PasswordCard({ surel }: { surel: string }) {
  const [state, action] = useActionState<ActionState, FormData>(changePassword, {});

  return (
    <>
      <GlassCard className="mt-4">
        <SectionTitle
          title="Ganti kata sandi"
          subtitle="Berlaku untuk akun yang sedang masuk"
          action={<KeyRound size={15} style={{ color: 'var(--text-muted)' }} />}
        />
        <form action={action} className="grid gap-3 sm:grid-cols-3">
          {/*
            Medan surel tersembunyi. Pengelola kata sandi memerlukan nama
            pengguna di dalam formulir yang sama untuk tahu kredensial mana
            yang sedang diganti; tanpa itu ia menyimpan sandi baru sebagai
            entri terpisah, dan pemakainya menemukan dua entri Racik dengan
            sandi berbeda tanpa tahu mana yang berlaku.

            Nilainya ikut terkirim bersama formulir, tetapi `changePassword`
            mengabaikannya dan mengambil identitas dari sesi — surel dari
            formulir tidak boleh menentukan akun siapa yang diubah.
          */}
          <input
            type="text"
            name="surel"
            value={surel}
            readOnly
            hidden
            autoComplete="username"
            aria-hidden
            tabIndex={-1}
          />
          <F label="Kata sandi saat ini">
            <input name="current" type="password" required autoComplete="current-password" className="field" />
          </F>
          <F label="Kata sandi baru">
            <input name="next" type="password" required minLength={8} autoComplete="new-password" className="field" />
          </F>
          <F label="Ulangi kata sandi baru">
            <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="field" />
          </F>
          <div className="sm:col-span-3 flex justify-end">
            <SubmitButton className="btn btn-ghost btn-sm">Ganti kata sandi</SubmitButton>
          </div>
        </form>
      </GlassCard>
      <Toast state={state.error || state.ok ? state : null} />
    </>
  );
}

/**
 * Rekening penyalur gaji.
 *
 * Kartunya bukan hiasan: ia menggambar isi ketiga kotak di sebelahnya, huruf
 * demi huruf, sebelum apa pun disimpan. Salah satu digit yang keliru terlihat
 * di kartu — bentuk yang sama dengan kartu di dompet — jauh lebih cepat
 * daripada memeriksa deretan angka di dalam kotak isian. Ini rekening yang
 * mendebet seluruh gaji perusahaan; salah ketik di sini mahal.
 */
function RekeningPenyalur({ data }: { data: SettingsData }) {
  const [bank, setBank] = useState(data.payoutBankName ?? '');
  const [nomor, setNomor] = useState(data.payoutBankAccount ?? '');
  const [pemilik, setPemilik] = useState(data.payoutBankHolder ?? '');

  return (
    <GlassCard>
      <SectionTitle
        title="Rekening penyalur gaji"
        subtitle="Rekening yang didebet saat gaji dibayarkan, dan tampil di dasbor"
        action={<CreditCard size={15} style={{ color: 'var(--text-muted)' }} />}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="grid gap-3 sm:grid-cols-2">
          <F label="Bank" hint="Mis. BCA, BNI, BRI, Mandiri">
            <input
              name="payoutBankName"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="field"
              autoComplete="off"
            />
          </F>
          <F label="Nomor rekening">
            <input
              name="payoutBankAccount"
              value={nomor}
              onChange={(e) => setNomor(e.target.value)}
              inputMode="numeric"
              className="field tnum"
              autoComplete="off"
            />
          </F>
          <F label="Atas nama" span2>
            <input
              name="payoutBankHolder"
              value={pemilik}
              onChange={(e) => setPemilik(e.target.value)}
              className="field"
              autoComplete="off"
            />
          </F>
          <p className="t-small sm:col-span-2">
            Dibiarkan kosong pun tidak apa-apa — hanya saja berkas transfer bank akan
            terbit tanpa rekening pendebet, dan bank biasanya menolaknya.
          </p>
        </div>

        <div className="lg:justify-self-end">
          <KartuBank bank={bank} nomor={nomor} pemilik={pemilik} label="Penyalur gaji" />
        </div>
      </div>
    </GlassCard>
  );
}

function Grup({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <div className="glass-thin px-4 py-3.5">
      <p className="label !mb-2.5">{judul}</p>
      <div className="grid gap-3 sm:grid-cols-3">{children}</div>
    </div>
  );
}

function F({
  label,
  children,
  hint,
  span2,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  span2?: boolean;
}) {
  return (
    <label className={span2 ? 'sm:col-span-2' : undefined}>
      <span className="mb-1 block t-label font-medium" style={{ color: 'var(--text-body)' }}>
        {label}
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
