import Link from 'next/link';
import { ArrowRight, ShieldX } from 'lucide-react';
import { homeFor, requireSession } from '@/lib/auth';
import { GlassCard, statusLabel } from '@/components/ui/Glass';

export const metadata = { title: 'Akses ditolak' };

const HAK: Record<string, string> = {
  ADMIN: 'Seluruh modul, termasuk pengaturan perusahaan dan jejak audit.',
  HR: 'Data karyawan, kehadiran, cuti, lembur, proses gaji, dan laporan.',
  EMPLOYEE: 'Portal mandiri: absensi, slip gaji, pengajuan cuti dan lembur.',
};

export default async function DeniedPage() {
  const session = await requireSession();
  const beranda = homeFor(session.role);

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-lg place-items-center">
      <GlassCard className="w-full text-center">
        <span
          className="mx-auto grid size-12 place-items-center rounded-full"
          style={{ background: 'rgb(168 90 79 / .14)', color: 'var(--color-clay-500)' }}
        >
          <ShieldX size={22} />
        </span>

        <h1 className="mt-4 t-title">Halaman ini di luar hak akses Anda</h1>
        <p className="mx-auto mt-2 max-w-sm t-small">
          Anda masuk sebagai <strong>{statusLabel(session.role)}</strong>. Peran ini punya akses ke:{' '}
          {HAK[session.role]}
        </p>

        <p className="mt-4 t-label" style={{ color: 'var(--text-muted)' }}>
          Bila Anda merasa seharusnya bisa membuka halaman ini, hubungi administrator sistem.
        </p>

        <Link href={beranda} className="btn btn-primary btn-sm mx-auto mt-5">
          Kembali ke halaman utama saya
          <ArrowRight size={14} />
        </Link>
      </GlassCard>
    </div>
  );
}
