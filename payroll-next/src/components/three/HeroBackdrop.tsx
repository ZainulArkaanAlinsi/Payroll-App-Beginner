'use client';

import dynamic from 'next/dynamic';

// Three.js butuh objek window, jadi harus dimuat setelah hidrasi.
// Pembungkus klien ini yang mengizinkan ssr:false — Server Component tidak boleh.
const NetworkField = dynamic(() => import('./NetworkField'), {
  ssr: false,
  loading: () => null,
});

export default function HeroBackdrop({ className }: { className?: string }) {
  return <NetworkField className={className} />;
}
