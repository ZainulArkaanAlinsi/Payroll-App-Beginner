'use client';

import { Printer } from 'lucide-react';
import ThemeToggle from '@/components/shell/ThemeToggle';

export default function PrintBar() {
  return (
    <div className="flex items-center gap-2">
      <ThemeToggle compact />
      <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
        <Printer size={13} />
        Cetak / simpan PDF
      </button>
    </div>
  );
}
