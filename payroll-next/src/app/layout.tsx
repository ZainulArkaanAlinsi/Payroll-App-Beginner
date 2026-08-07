import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LiquidFilters } from '@/components/ui/Glass';

export const metadata: Metadata = {
  title: {
    default: 'NusaPay — Sistem Penggajian Modern',
    template: '%s · NusaPay',
  },
  description:
    'Platform penggajian untuk perusahaan Indonesia: perhitungan PPh 21 metode TER, iuran BPJS, lembur, cuti, dan slip gaji dalam satu alur kerja.',
  applicationName: 'NusaPay',
  authors: [{ name: 'Zainul Arkaan' }],
  keywords: ['payroll', 'penggajian', 'PPh 21', 'BPJS', 'HRIS', 'Indonesia'],
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eceeec' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1012' },
  ],
};

// Menentukan tema sebelum paint pertama. Tanpa ini, halaman berkedip
// putih sesaat sebelum React sempat memasang kelas .dark.
const THEME_BOOT = `
(function(){
  try {
    var s = localStorage.getItem('nusapay-theme');
    var d = s ? s === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (d) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>
        <div className="atmosphere" />
        <LiquidFilters />
        {children}
      </body>
    </html>
  );
}
