import type { Role } from './auth';

export interface NavItem {
  href: string;
  label: string;
  icon: string; // nama ikon lucide, dipetakan di sisi klien
  roles: Role[];
  group: string;
  hint?: string;
}

/** Sumber tunggal untuk sidebar, palet perintah, dan pencarian. */
export const NAV: NavItem[] = [
  // Karyawan biasa tidak melihat dasbor perusahaan — pintu masuknya Portal Saya.
  { href: '/dashboard', label: 'Dasbor', icon: 'LayoutDashboard', roles: ['ADMIN', 'HR'], group: 'Ringkasan', hint: 'Ikhtisar biaya & tren' },

  { href: '/employees', label: 'Karyawan', icon: 'Users', roles: ['ADMIN', 'HR'], group: 'Kepegawaian', hint: 'Data induk karyawan' },
  { href: '/org', label: 'Organisasi', icon: 'Network', roles: ['ADMIN', 'HR'], group: 'Kepegawaian', hint: 'Departemen & posisi' },
  { href: '/attendance', label: 'Kehadiran', icon: 'CalendarCheck', roles: ['ADMIN', 'HR'], group: 'Kepegawaian', hint: 'Rekap absensi bulanan' },
  { href: '/leave', label: 'Cuti', icon: 'Palmtree', roles: ['ADMIN', 'HR'], group: 'Kepegawaian', hint: 'Pengajuan & persetujuan' },
  { href: '/overtime', label: 'Lembur', icon: 'Timer', roles: ['ADMIN', 'HR'], group: 'Kepegawaian', hint: 'Pengajuan & persetujuan' },

  { href: '/compensation', label: 'Komponen Gaji', icon: 'Layers', roles: ['ADMIN', 'HR'], group: 'Penggajian', hint: 'Tunjangan & potongan' },
  { href: '/payroll', label: 'Proses Gaji', icon: 'Wallet', roles: ['ADMIN', 'HR'], group: 'Penggajian', hint: 'Jalankan payroll periode' },
  { href: '/payslips', label: 'Slip Gaji', icon: 'Receipt', roles: ['ADMIN', 'HR'], group: 'Penggajian', hint: 'Arsip slip semua karyawan' },
  { href: '/reports', label: 'Laporan', icon: 'ChartColumn', roles: ['ADMIN', 'HR'], group: 'Penggajian', hint: 'Analitik & ekspor CSV' },

  { href: '/me', label: 'Portal Saya', icon: 'CircleUser', roles: ['ADMIN', 'HR', 'EMPLOYEE'], group: 'Mandiri', hint: 'Slip, cuti, kehadiran saya' },

  { href: '/settings', label: 'Pengaturan', icon: 'Settings', roles: ['ADMIN'], group: 'Sistem', hint: 'Profil perusahaan, BPJS, jam kerja' },
  { href: '/audit', label: 'Jejak Audit', icon: 'ScrollText', roles: ['ADMIN'], group: 'Sistem', hint: 'Riwayat perubahan sistem' },
];

export function navFor(role: Role) {
  return NAV.filter((n) => n.roles.includes(role));
}

export function groupedNavFor(role: Role) {
  const items = navFor(role);
  const groups: { name: string; items: NavItem[] }[] = [];
  for (const it of items) {
    let g = groups.find((x) => x.name === it.group);
    if (!g) {
      g = { name: it.group, items: [] };
      groups.push(g);
    }
    g.items.push(it);
  }
  return groups;
}
