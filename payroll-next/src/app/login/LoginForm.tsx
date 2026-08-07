'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle, Eye, EyeOff, LoaderCircle, LogIn } from 'lucide-react';
import { loginAction, type FormState } from '@/actions/auth';
import { GlassCard, Avatar } from '@/components/ui/Glass';

const DEMO = [
  { role: 'Administrator', email: 'admin@racik.id', name: 'Zainul Arkaan', desc: 'akses penuh' },
  {
    role: 'HRD',
    email: 'larasati.widyaningrum@nusantaradigital.id',
    name: 'Larasati Widyaningrum',
    desc: 'kelola karyawan & persetujuan',
  },
  {
    role: 'Karyawan',
    email: 'bagas.setiawan@nusantaradigital.id',
    name: 'Bagas Setiawan',
    desc: 'portal mandiri',
  },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full" disabled={pending}>
      {pending ? (
        <>
          <LoaderCircle size={15} className="animate-spin" />
          Memverifikasi…
        </>
      ) : (
        <>
          <LogIn size={15} />
          Masuk
        </>
      )}
    </button>
  );
}

export default function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(loginAction, {});
  const [email, setEmail] = useState('admin@racik.id');
  const [password, setPassword] = useState('password123');
  const [show, setShow] = useState(false);

  return (
    <div className="rise">
      <h2 className="t-display">
        Masuk ke Racik
      </h2>
      <p className="mt-1.5 t-small">
        Pilih salah satu akun demo di bawah, atau isi kredensial sendiri.
      </p>

      <form action={action} className="mt-7 space-y-4">
        <div>
          <label htmlFor="email" className="label">
            Surel
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.id"
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Kata sandi
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className="field pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {state.error && (
          <div
            className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs"
            style={{
              background: 'rgb(168 90 79 / .14)',
              border: '1px solid rgb(168 90 79 / .3)',
              color: 'var(--color-clay-500)',
            }}
            role="alert"
          >
            <AlertCircle size={14} className="mt-px shrink-0" />
            {state.error}
          </div>
        )}

        <SubmitButton />
      </form>

      <div className="mt-8">
        <p className="label">Akun demo — klik untuk mengisi</p>
        <div className="space-y-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => {
                setEmail(d.email);
                setPassword('password123');
              }}
              className="w-full text-left"
            >
              <GlassCard
                hover
                padded={false}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <Avatar name={d.name} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span
                      className="t-small font-medium"
                      style={{ color: 'var(--text-strong)' }}
                    >
                      {d.role}
                    </span>
                    <span className="truncate t-micro" style={{ color: 'var(--text-muted)' }}>
                      {d.desc}
                    </span>
                  </span>
                  <span
                    className="block truncate t-micro"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {d.email}
                  </span>
                </span>
              </GlassCard>
            </button>
          ))}
        </div>
        <p className="mt-3 t-micro" style={{ color: 'var(--text-muted)' }}>
          Kata sandi untuk semua akun demo: <code className="font-mono">password123</code>
        </p>
      </div>
    </div>
  );
}
