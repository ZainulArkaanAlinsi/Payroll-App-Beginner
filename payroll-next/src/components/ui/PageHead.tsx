import type { ReactNode } from 'react';

/**
 * Kepala halaman yang seragam.
 *
 * Sebelumnya tiap halaman menyusun judulnya sendiri dengan markup berbeda,
 * sehingga posisi judul dan jarak ke kartu pertama bergeser saat berpindah
 * menu. Satu komponen ini memastikan letaknya selalu sama.
 */
export default function PageHead({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="page-head">
      <div className="min-w-0">
        {eyebrow && <p className="label !mb-1">{eyebrow}</p>}
        <h1 className="t-display">{title}</h1>
        {subtitle && <p className="mt-1 t-small">{subtitle}</p>}
      </div>
      {actions && <div className="page-head-actions">{actions}</div>}
    </div>
  );
}
