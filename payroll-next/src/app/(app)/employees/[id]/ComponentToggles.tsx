'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { toggleComponent } from '@/actions/employees';
import { Chip } from '@/components/ui/Glass';
import { Toast } from '@/components/ui/Feedback';
import { rupiah } from '@/lib/format';
import type { ActionState } from '@/lib/types';

interface Row {
  id: string;
  code: string;
  name: string;
  type: string;
  calcType: string;
  amount: number;
  percent: number;
  taxable: boolean;
  attached: boolean;
}

export default function ComponentToggles({
  employeeId,
  baseSalary,
  components,
}: {
  employeeId: string;
  baseSalary: number;
  components: Row[];
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();
  const [result, setResult] = useState<ActionState | null>(null);
  const router = useRouter();

  const nilai = (c: Row) =>
    c.calcType === 'PERCENT_OF_BASE' ? Math.round((baseSalary * c.percent) / 100) : c.amount;

  const flip = (c: Row) => {
    setPendingId(c.id);
    start(async () => {
      const s = await toggleComponent(employeeId, c.id, !c.attached);
      setResult(s);
      setPendingId(null);
      router.refresh();
    });
  };

  const tunjangan = components.filter((c) => c.type === 'ALLOWANCE');
  const potongan = components.filter((c) => c.type === 'DEDUCTION');

  const grup = (judul: string, rows: Row[]) =>
    rows.length > 0 && (
      <div>
        <p className="label">{judul}</p>
        <ul className="space-y-1.5">
          {rows.map((c) => (
            <li key={c.id}>
              <label
                className="glass-thin flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors"
                style={{
                  borderColor: c.attached
                    ? 'color-mix(in srgb, var(--accent) 34%, transparent)'
                    : undefined,
                }}
              >
                <input
                  type="checkbox"
                  checked={c.attached}
                  onChange={() => flip(c)}
                  disabled={pendingId === c.id}
                  className="size-4 shrink-0 rounded"
                  style={{ accentColor: 'var(--color-jade-600)' }}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate t-small font-medium"
                    style={{ color: 'var(--text-strong)' }}
                  >
                    {c.name}
                  </span>
                  <span className="block t-micro" style={{ color: 'var(--text-muted)' }}>
                    {c.code} ·{' '}
                    {c.calcType === 'PERCENT_OF_BASE' ? `${c.percent}% gaji pokok` : 'nominal tetap'}
                  </span>
                </span>
                {!c.taxable && c.type === 'ALLOWANCE' && <Chip tone="info">bebas pajak</Chip>}
                {pendingId === c.id ? (
                  <LoaderCircle size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <span
                    className="tnum shrink-0 t-small font-semibold"
                    style={{
                      color: c.type === 'ALLOWANCE' ? 'var(--text-strong)' : 'var(--color-clay-500)',
                    }}
                  >
                    {c.type === 'ALLOWANCE' ? '' : '−'}
                    {rupiah(nilai(c))}
                  </span>
                )}
              </label>
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {grup('Tunjangan', tunjangan)}
        {grup('Potongan', potongan)}
      </div>
      <Toast state={result} onDismiss={() => setResult(null)} />
    </>
  );
}
