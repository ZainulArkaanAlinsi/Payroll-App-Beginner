import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import SettingsForm from './SettingsForm';

export const metadata = { title: 'Pengaturan' };

export default async function SettingsPage() {
  await requireRole('ADMIN');

  const setting =
    (await prisma.companySetting.findUnique({ where: { id: 'singleton' } })) ??
    (await prisma.companySetting.create({ data: { id: 'singleton' } }));

  return (
    <div className="page">
      <div className="page-head">
        <div className="min-w-0">
          <h1 className="t-display">Pengaturan</h1>
          <p className="mt-1 t-small">
            Perubahan tarif baru berlaku pada perhitungan payroll berikutnya. Periode yang sudah
            dibayarkan tidak terpengaruh.
          </p>
        </div>
      </div>

      <div className="page-narrow">
      <SettingsForm
        data={{
          name: setting.name,
          legalName: setting.legalName,
          npwp: setting.npwp,
          address: setting.address,
          phone: setting.phone,
          email: setting.email,
          logoInitials: setting.logoInitials,
          workStart: setting.workStart,
          workEnd: setting.workEnd,
          workDays: setting.workDays,
          lateToleranceMin: setting.lateToleranceMin,
          payDay: setting.payDay,
          cutoffDay: setting.cutoffDay,
          bpjsKesEmployeeRate: setting.bpjsKesEmployeeRate,
          bpjsKesEmployerRate: setting.bpjsKesEmployerRate,
          bpjsKesCap: setting.bpjsKesCap,
          bpjsJhtEmployeeRate: setting.bpjsJhtEmployeeRate,
          bpjsJhtEmployerRate: setting.bpjsJhtEmployerRate,
          bpjsJpEmployeeRate: setting.bpjsJpEmployeeRate,
          bpjsJpEmployerRate: setting.bpjsJpEmployerRate,
          bpjsJpCap: setting.bpjsJpCap,
          bpjsJkkRate: setting.bpjsJkkRate,
          bpjsJkmRate: setting.bpjsJkmRate,
          lateCutPerMinute: setting.lateCutPerMinute,
          absentCutPerDay: setting.absentCutPerDay,
          minimumWage: setting.minimumWage,
          minimumWageRegion: setting.minimumWageRegion,
          enforceBasicRatio: setting.enforceBasicRatio,
        }}
      />
      </div>
    </div>
  );
}
