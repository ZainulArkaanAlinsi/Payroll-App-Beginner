import Link from 'next/link';
import { CalendarCheck } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jamMenit, labelPeriode, periodeSekarang } from '@/lib/format';
import {
  Avatar, Chip, EmptyState, GlassCard, MiniBar, SectionTitle,
} from '@/components/ui/Glass';
import StatTile from '@/components/ui/StatTile';
import PeriodPicker from '@/components/ui/PeriodPicker';
import { Donut, Heatmap } from '@/components/ui/charts';

export const metadata = { title: 'Kehadiran' };

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole('ADMIN', 'HR');
  const sp = await searchParams;
  const period = /^\d{4}-\d{2}$/.test(sp.period ?? '') ? sp.period! : periodeSekarang();
  const [y, m] = period.split('-').map(Number);

  const awal = new Date(y, m - 1, 1);
  const akhir = new Date(y, m, 1);
  const jumlahHari = new Date(y, m, 0).getDate();

  const [rows, employees] = await Promise.all([
    prisma.attendance.findMany({
      where: { date: { gte: awal, lt: akhir } },
      select: { employeeId: true, date: true, status: true, lateMinutes: true, workMinutes: true },
    }),
    prisma.employee.findMany({
      where: { status: { in: ['ACTIVE', 'ON_LEAVE'] } },
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        employeeNo: true,
        department: { select: { name: true } },
      },
    }),
  ]);

  // ── agregasi per karyawan ──
  const perOrang = new Map<
    string,
    { hadir: number; telat: number; wfh: number; cuti: number; mangkir: number; menitTelat: number; menitKerja: number }
  >();
  for (const e of employees) {
    perOrang.set(e.id, { hadir: 0, telat: 0, wfh: 0, cuti: 0, mangkir: 0, menitTelat: 0, menitKerja: 0 });
  }
  for (const r of rows) {
    const a = perOrang.get(r.employeeId);
    if (!a) continue;
    if (r.status === 'PRESENT') a.hadir++;
    else if (r.status === 'LATE') a.telat++;
    else if (r.status === 'WFH') a.wfh++;
    else if (r.status === 'LEAVE') a.cuti++;
    else if (r.status === 'ABSENT') a.mangkir++;
    a.menitTelat += r.lateMinutes;
    a.menitKerja += r.workMinutes;
  }

  // ── agregasi per tanggal untuk peta panas ──
  const perHari = new Map<number, number>();
  for (const r of rows) {
    if (!['PRESENT', 'LATE', 'WFH'].includes(r.status)) continue;
    const d = r.date.getDate();
    perHari.set(d, (perHari.get(d) ?? 0) + 1);
  }
  const puncak = Math.max(...perHari.values(), 1);

  const cells = Array.from({ length: jumlahHari }, (_, i) => {
    const hari = i + 1;
    const tanggalIni = new Date(y, m - 1, hari);
    const akhirPekan = [0, 6].includes(tanggalIni.getDay());
    const nilai = perHari.get(hari) ?? 0;
    return {
      key: `d${hari}`,
      label: `${hari} ${labelPeriode(period)} (${HARI[tanggalIni.getDay()]})`,
      value: nilai,
      // akhir pekan sengaja dibiarkan kosong, bukan dianggap sepi
      intensity: akhirPekan || nilai === 0 ? 0 : Math.ceil((nilai / puncak) * 5),
    };
  });

  const total = rows.length;
  const hadirTotal = rows.filter((r) => ['PRESENT', 'LATE', 'WFH'].includes(r.status)).length;
  const telatTotal = rows.filter((r) => r.status === 'LATE').length;
  const mangkirTotal = rows.filter((r) => r.status === 'ABSENT').length;
  const cutiTotal = rows.filter((r) => r.status === 'LEAVE').length;
  const wfhTotal = rows.filter((r) => r.status === 'WFH').length;
  const menitTelatTotal = rows.reduce((s, r) => s + r.lateMinutes, 0);

  const komposisi = [
    { label: 'Hadir di kantor', value: rows.filter((r) => r.status === 'PRESENT').length },
    { label: 'Kerja jarak jauh', value: wfhTotal },
    { label: 'Terlambat', value: telatTotal },
    { label: 'Cuti', value: cutiTotal },
    { label: 'Mangkir', value: mangkirTotal },
  ].filter((k) => k.value > 0);

  const daftar = employees
    .map((e) => ({ e, a: perOrang.get(e.id)! }))
    .sort((x, ymm) => ymm.a.mangkir - x.a.mangkir || ymm.a.menitTelat - x.a.menitTelat);

  // Ambang sengaja ditetapkan: mangkir sama sekali, atau akumulasi telat
  // lebih dari satu jam sebulan. Menampilkan semua orang membuat daftarnya
  // tidak berarti apa-apa.
  const perluPerhatian = daftar
    .filter(({ a }) => a.mangkir > 0 || a.menitTelat > 60)
    .slice(0, 6);

  const hariKerja = cells.filter((c) => !c.label.includes('(Min)') && !c.label.includes('(Sab)')).length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">
            Kehadiran
          </h1>
          <p className="mt-1 t-small">
            {employees.length} karyawan · {hariKerja} hari kerja pada {labelPeriode(period)}
          </p>
        </div>
        <PeriodPicker period={period} max={periodeSekarang()} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Tingkat kehadiran"
          value={total > 0 ? `${((hadirTotal / total) * 100).toFixed(1)}%` : '—'}
          sub={`${hadirTotal} dari ${total} catatan`}
        />
        <StatTile label="Keterlambatan" value={String(telatTotal)} sub={jamMenit(menitTelatTotal)} />
        <StatTile label="Mangkir" value={String(mangkirTotal)} sub="tanpa keterangan" />
        <StatTile label="Kerja jarak jauh" value={String(wfhTotal)} sub="hari kerja" />
      </div>

      {total === 0 ? (
        <GlassCard>
          <EmptyState
            icon={<CalendarCheck size={18} />}
            title={`Belum ada catatan kehadiran pada ${labelPeriode(period)}`}
            hint="Kehadiran terisi saat karyawan absen dari portal, atau saat cuti disetujui."
          />
        </GlassCard>
      ) : (
        <>
          {perluPerhatian.length > 0 && (
            <GlassCard>
              <SectionTitle
                title="Perlu ditindaklanjuti"
                subtitle="Karyawan dengan mangkir atau keterlambatan menonjol pada periode ini"
                action={<Chip tone="brass">{perluPerhatian.length} orang</Chip>}
              />
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {perluPerhatian.map(({ e, a }) => (
                  <li key={e.id}>
                    <Link
                      href={`/employees/${e.id}`}
                      className="glass-thin flex items-center gap-2.5 px-3.5 py-2.5 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)]"
                    >
                      <Avatar name={e.fullName} size={30} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate t-small font-medium" style={{ color: 'var(--text-strong)' }}>
                          {e.fullName}
                        </span>
                        <span className="block truncate t-micro">{e.department?.name ?? '—'}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        {a.mangkir > 0 && (
                          <span className="block t-micro" style={{ color: 'var(--color-clay-500)' }}>
                            {a.mangkir} hari mangkir
                          </span>
                        )}
                        {a.menitTelat > 0 && (
                          <span className="block t-micro" style={{ color: 'var(--color-brass-500)' }}>
                            telat {jamMenit(a.menitTelat)}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <GlassCard>
              <SectionTitle
                title="Kepadatan kehadiran harian"
                subtitle="Semakin gelap semakin banyak karyawan yang masuk. Akhir pekan dibiarkan kosong."
              />
              <Heatmap cells={cells} legendLabels={['sepi', 'padat']} />
            </GlassCard>

            <GlassCard>
              <SectionTitle title="Komposisi status" subtitle={labelPeriode(period)} />
              <Donut
                data={komposisi}
                centerLabel="Total catatan"
                centerValue={String(total)}
                format="hari"
              />
            </GlassCard>
          </div>

          <GlassCard>
            <SectionTitle
              title="Rekap per karyawan"
              subtitle="Diurutkan dari yang paling banyak mangkir dan terlambat"
            />
            <div className="tbl-scroll scroll-slim">
              <table className="tbl" style={{ minWidth: 840 }}>
                <thead>
                  <tr>
                    {['Karyawan', 'Hadir', 'Jarak jauh', 'Terlambat', 'Cuti', 'Mangkir', 'Akumulasi telat', 'Kedisiplinan'].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={`${
                            i === 0 || i === 7 ? 'text-left' : 'text-right'
                          }`}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {daftar.map(({ e, a }) => {
                    const dicatat = a.hadir + a.telat + a.wfh + a.cuti + a.mangkir;
                    const tepat = a.hadir + a.wfh;
                    const skor = dicatat > 0 ? (tepat / dicatat) * 100 : 0;
                    return (
                      <tr
                        key={e.id}
                      >
                        <td>
                          <Link href={`/employees/${e.id}`} className="flex items-center gap-2.5">
                            <Avatar name={e.fullName} size={28} />
                            <span className="min-w-0">
                              <span
                                className="block truncate t-small font-medium"
                                style={{ color: 'var(--text-strong)' }}
                              >
                                {e.fullName}
                              </span>
                              <span
                                className="block truncate t-micro"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                {e.department?.name ?? '—'}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="tnum text-right t-small">{a.hadir}</td>
                        <td className="tnum text-right t-small">{a.wfh}</td>
                        <td
                          className="tnum text-right t-small"
                          style={{ color: a.telat > 0 ? 'var(--color-brass-500)' : undefined }}
                        >
                          {a.telat}
                        </td>
                        <td className="tnum text-right t-small">{a.cuti}</td>
                        <td
                          className="tnum text-right t-small"
                          style={{ color: a.mangkir > 0 ? 'var(--color-clay-500)' : undefined }}
                        >
                          {a.mangkir}
                        </td>
                        <td className="tnum text-right t-label">
                          {a.menitTelat > 0 ? jamMenit(a.menitTelat) : '—'}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="w-24">
                              <MiniBar
                                value={skor}
                                max={100}
                                tone={skor >= 90 ? 'jade' : skor >= 75 ? 'brass' : 'clay'}
                              />
                            </span>
                            <span className="tnum t-micro" style={{ color: 'var(--text-muted)' }}>
                              {skor.toFixed(0)}%
                            </span>
                            {a.mangkir >= 3 && <Chip tone="clay">perlu ditegur</Chip>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
