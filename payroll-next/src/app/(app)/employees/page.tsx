import Link from 'next/link';
import { ChevronRight, Download, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rupiah, rupiahRingkas, tanggal } from '@/lib/format';
import { Avatar, Chip, EmptyState, GlassCard, StatusChip } from '@/components/ui/Glass';
import TableToolbar from '@/components/ui/TableToolbar';
import PanelUtama, { RingkasPanel } from '@/components/ui/PanelUtama';
import KepatuhanPanel from './KepatuhanPanel';
import { periksaKepatuhan } from '@/lib/kepatuhan';
import { tunjanganTetap } from '@/lib/components';
import EmployeeDialog from './EmployeeDialog';

export const metadata = { title: 'Karyawan' };

const PAGE_SIZE = 15;

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole('ADMIN', 'HR');
  const sp = await searchParams;

  const q = sp.q?.trim() ?? '';
  const dept = sp.dept ?? '';
  const status = sp.status ?? '';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  const where = {
    ...(q
      ? {
          OR: [
            { fullName: { contains: q } },
            { employeeNo: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {}),
    ...(dept ? { departmentId: dept } : {}),
    ...(status ? { status } : {}),
  };

  const [employees, total, departments, positions, ringkas] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: {
        department: { select: { name: true } },
        position: { select: { title: true, level: true } },
      },
      orderBy: [{ status: 'asc' }, { fullName: 'asc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.employee.count({ where }),
    prisma.department.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.position.findMany({
      orderBy: { title: 'asc' },
      select: { id: true, title: true, departmentId: true, minSalary: true, maxSalary: true },
    }),
    prisma.employee.groupBy({ by: ['status'], _count: true }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const jml = (s: string) => ringkas.find((r) => r.status === s)?._count ?? 0;

  const [setting, semuaAktif] = await Promise.all([
    prisma.companySetting.findUnique({ where: { id: 'singleton' } }),
    prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        fullName: true,
        baseSalary: true,
        status: true,
        // dibutuhkan untuk menyaring komponen yang cakupannya per divisi
        departmentId: true,
        position: { select: { level: true } },
        components: {
          where: { component: { type: 'ALLOWANCE', active: true, calcType: { not: 'FORMULA' } } },
          include: { component: true },
        },
      },
    }),
  ]);

  // Tunjangan tetap = komponen bernilai pasti. Komponen berumus dikecualikan
  // karena nilainya bergantung kehadiran, jadi bukan "tunjangan tetap"
  // menurut PP 36/2021.
  const temuanKepatuhan = periksaKepatuhan(
    semuaAktif.map((e) => ({
      id: e.id,
      nama: e.fullName,
      gajiPokok: e.baseSalary,
      // Memakai fungsi yang sama dengan mesin gaji dan dasar upah lembur.
      // Perhitungan sendiri di sini sebelumnya ikut menjumlahkan komponen
      // potongan sebagai tunjangan, dan mengabaikan komponen yang tidak aktif
      // maupun yang cakupannya tidak berlaku bagi karyawan bersangkutan.
      tunjanganTetap: tunjanganTetap(e.components, {
        departmentId: e.departmentId,
        level: e.position?.level ?? null,
        baseSalary: e.baseSalary,
        variables: {} as never,
      }),
      status: e.status,
    })),
    {
      upahMinimum: setting?.minimumWage ?? 0,
      wilayah: setting?.minimumWageRegion ?? '—',
      periksaRasioPokok: setting?.enforceBasicRatio ?? true,
    },
  );

  const [gajiAktif, tanpaNpwp, kontrak, barusanMasuk] = await Promise.all([
    prisma.employee.aggregate({ where: { status: 'ACTIVE' }, _avg: { baseSalary: true }, _sum: { baseSalary: true } }),
    prisma.employee.count({ where: { status: 'ACTIVE', npwp: null } }),
    prisma.employee.count({ where: { status: 'ACTIVE', employmentType: 'CONTRACT' } }),
    // Karyawan yang baru bergabung 90 hari terakhir — biasanya yang datanya
    // masih perlu dilengkapi HR.
    prisma.employee.count({
      where: { status: 'ACTIVE', joinDate: { gte: new Date(Date.now() - 90 * 86_400_000) } },
    }),
  ]);

  const qs = (patch: Record<string, string>) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (dept) p.set('dept', dept);
    if (status) p.set('status', status);
    for (const [k, v] of Object.entries(patch)) v ? p.set(k, v) : p.delete(k);
    return `?${p.toString()}`;
  };

  return (
    <div className="page">
      <PanelUtama
        judul="Karyawan"
        nilai={rupiah(gajiAktif._sum.baseSalary ?? 0)}
        nilaiLabel="beban gaji pokok per bulan"
        keterangan={[
          `${jml('ACTIVE')} karyawan aktif`,
          kontrak > 0 ? `${kontrak} di antaranya kontrak` : 'seluruhnya karyawan tetap',
          `rata-rata ${rupiahRingkas(gajiAktif._avg.baseSalary ?? 0)} per orang`,
          jml('RESIGNED') > 0 ? `${jml('RESIGNED')} sudah tidak aktif` : '',
        ]
          .filter(Boolean)
          .join(' · ')}
        aksi={[{ href: '/api/export/employees', teks: 'Ekspor CSV', ikon: <Download size={15} /> }]}
        anak={<EmployeeDialog departments={departments} positions={positions} />}
        samping={
          /* Dua angka yang tidak bisa dibaca dari daftar karena keduanya soal
             yang HILANG: NPWP yang belum ada, dan orang baru yang datanya
             mungkin belum lengkap. Keduanya berbiaya nyata — tanpa NPWP,
             PPh 21 dipotong 20% lebih tinggi. */
          <div className="grid grid-cols-2 gap-2">
            <RingkasPanel
              nilai={String(tanpaNpwp)}
              label="belum punya NPWP"
              catatan={tanpaNpwp > 0 ? 'PPh 21 +20%' : 'semua terdaftar'}
              tegang={tanpaNpwp > 0}
            />
            <RingkasPanel
              nilai={String(barusanMasuk)}
              label="masuk 90 hari terakhir"
              catatan={barusanMasuk > 0 ? 'periksa kelengkapan' : 'tidak ada'}
            />
          </div>
        }
      />

      {temuanKepatuhan.length > 0 && <KepatuhanPanel temuan={temuanKepatuhan} />}

      <GlassCard>
        <TableToolbar
          searchPlaceholder="Cari nama, nomor induk, atau surel…"
          filters={[
            {
              name: 'dept',
              label: 'Semua departemen',
              options: departments.map((d) => ({ value: d.id, label: d.name })),
            },
            {
              name: 'status',
              label: 'Semua status',
              options: [
                { value: 'ACTIVE', label: 'Aktif' },
                { value: 'ON_LEAVE', label: 'Cuti panjang' },
                { value: 'RESIGNED', label: 'Mengundurkan diri' },
                { value: 'TERMINATED', label: 'Diberhentikan' },
              ],
            },
          ]}
        />

        {employees.length === 0 ? (
          <EmptyState
            icon={<Users size={18} />}
            title="Tidak ada karyawan yang cocok"
            hint="Coba ubah kata kunci atau bersihkan penyaring."
          />
        ) : (
          <div className="tbl-scroll scroll-slim">
            <table className="tbl" style={{ minWidth: 820 }}>
              <thead>
                <tr>
                  {['Karyawan', 'Departemen', 'Posisi', 'Bergabung', 'Gaji pokok', 'PTKP', 'Status', ''].map(
                    (h, i) => (
                      <th
                        key={h || i}
                        className={`${
                          i === 4 ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr
                    key={e.id}
                  >
                    <td>
                      <Link href={`/employees/${e.id}`} className="flex items-center gap-2.5">
                        <Avatar name={e.fullName} size={32} />
                        <span className="min-w-0">
                          <span
                            className="block truncate font-medium"
                            style={{ color: 'var(--text-strong)' }}
                          >
                            {e.fullName}
                          </span>
                          <span
                            className="tnum block truncate t-micro"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {e.employeeNo} · {e.email}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="t-small">{e.department?.name ?? '—'}</td>
                    <td className="t-small">{e.position?.title ?? '—'}</td>
                    <td className="t-small">{tanggal(e.joinDate)}</td>
                    <td
                      className="tnum text-right t-small font-medium"
                      style={{ color: 'var(--text-strong)' }}
                    >
                      {rupiah(e.baseSalary)}
                    </td>
                    <td>
                      <span className="tnum t-label">{e.ptkpStatus}</span>
                      {!e.npwp && (
                        <span className="ml-1.5">
                          <Chip tone="brass">tanpa NPWP</Chip>
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusChip status={e.status} />
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/employees/${e.id}`}
                        className="inline-flex items-center"
                        style={{ color: 'var(--text-muted)' }}
                        aria-label={`Lihat detail ${e.fullName}`}
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div
            className="mt-4 flex items-center justify-between border-t pt-3 t-label"
            style={{ borderColor: 'var(--hairline)' }}
          >
            <span style={{ color: 'var(--text-muted)' }}>
              Halaman {page} dari {pages}
            </span>
            <div className="page-head-actions">
              <Link
                href={qs({ page: String(page - 1) })}
                className="btn btn-ghost btn-sm"
                style={{ pointerEvents: page <= 1 ? 'none' : undefined, opacity: page <= 1 ? 0.4 : 1 }}
              >
                Sebelumnya
              </Link>
              <Link
                href={qs({ page: String(page + 1) })}
                className="btn btn-ghost btn-sm"
                style={{
                  pointerEvents: page >= pages ? 'none' : undefined,
                  opacity: page >= pages ? 0.4 : 1,
                }}
              >
                Berikutnya
              </Link>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
