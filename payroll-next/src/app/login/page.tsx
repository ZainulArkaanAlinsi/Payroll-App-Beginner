import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getSession, homeFor } from '@/lib/auth';
import LoginForm from './LoginForm';
import HeroBackdrop from '@/components/three/HeroBackdrop';
import ThemeToggle from '@/components/shell/ThemeToggle';

export const metadata = { title: 'Masuk' };

export default async function LoginPage() {
  const existing = await getSession();
  if (existing) redirect(homeFor(existing.role));

  return (
    <main className="relative grid min-h-dvh lg:grid-cols-2">
      {/* panel kiri: identitas produk */}
      <section className="relative hidden overflow-hidden lg:block">
        <HeroBackdrop className="absolute inset-0 opacity-60" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={14} />
            Kembali ke beranda
          </Link>

          <div className="max-w-md">
            <h1 className="text-3xl leading-tight font-semibold" style={{ letterSpacing: '-0.028em' }}>
              Gaji dihitung benar, sampai rupiah terakhir.
            </h1>
            <p className="mt-4 text-sm leading-relaxed">
              PPh 21 metode TER, iuran BPJS lima program, lembur sesuai Kepmenaker, dan slip gaji
              yang bisa ditelusuri — dalam satu proses.
            </p>
          </div>

          <p className="t-micro" style={{ color: 'var(--text-muted)' }}>
            Racik — proyek portofolio oleh Zainul Arkaan
          </p>
        </div>
      </section>

      {/* panel kanan: formulir */}
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              <ArrowLeft size={14} />
              Beranda
            </Link>
            <ThemeToggle compact />
          </div>

          <LoginForm />
        </div>
      </section>

      <div className="absolute top-6 right-6 hidden lg:block">
        <ThemeToggle compact />
      </div>
    </main>
  );
}
