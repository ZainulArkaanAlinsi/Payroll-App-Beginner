'use client';

/**
 * Editor rumus untuk HR.
 *
 * Tujuannya satu: orang non-teknis bisa mengubah cara gaji dihitung tanpa
 * memanggil programmer. Karena itu setiap kesalahan harus ketahuan sambil
 * mengetik, variabel bisa disisipkan dengan sekali klik, dan hasilnya
 * langsung terlihat memakai angka contoh.
 */

import { useMemo, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Plus } from 'lucide-react';
import { FUNGSI, VARIABEL, validateFormula } from '@/lib/formula';
import { rupiah } from '@/lib/format';

const CONTOH = [
  { label: 'Per hari hadir', rumus: 'HARI_HADIR * 45000' },
  { label: 'Persentase berplafon', rumus: 'MIN(GAJI_POKOK * 0,05; 500000)' },
  { label: 'Bertingkat masa kerja', rumus: 'MIN(FLOOR(MASA_KERJA_BULAN / 12) * 250000; 2000000)' },
  { label: 'Bersyarat', rumus: 'IF(MASA_KERJA_BULAN >= 12; 1000000; 500000)' },
  { label: 'Denda telat bertoleransi', rumus: 'IF(MENIT_TELAT > 30; (MENIT_TELAT - 30) * 2500; 0)' },
  { label: 'Lembur tarif rata', rumus: 'JAM_LEMBUR * 75000' },
];

export default function FormulaEditor({
  name,
  defaultValue = '',
}: {
  name: string;
  defaultValue?: string;
}) {
  const [src, setSrc] = useState(defaultValue);
  const [tab, setTab] = useState<'variabel' | 'fungsi' | 'contoh'>('variabel');
  const ref = useRef<HTMLTextAreaElement>(null);

  const cek = useMemo(() => (src.trim() ? validateFormula(src) : null), [src]);

  // menyisipkan di posisi kursor, bukan menimpa seluruh isi
  const sisip = (teks: string) => {
    const el = ref.current;
    if (!el) {
      setSrc((s) => s + teks);
      return;
    }
    const a = el.selectionStart ?? src.length;
    const b = el.selectionEnd ?? src.length;
    const next = src.slice(0, a) + teks + src.slice(b);
    setSrc(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = a + teks.length;
    });
  };

  return (
    <div>
      <textarea
        ref={ref}
        name={name}
        value={src}
        onChange={(e) => setSrc(e.target.value)}
        rows={3}
        spellCheck={false}
        placeholder="mis. MIN(GAJI_POKOK * 0,05; 500000)"
        className="field resize-none font-mono"
        style={{ fontSize: '0.8125rem', lineHeight: '1.4' }}
      />

      {/* umpan balik langsung — benar atau salah, selalu terlihat */}
      <div className="mt-2 min-h-[34px]">
        {cek === null ? (
          <p className="t-micro">Ketik rumus, hasilnya akan langsung diperiksa di sini.</p>
        ) : cek.ok ? (
          <div
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
            style={{ background: 'rgb(46 133 104 / .12)' }}
          >
            <CircleCheck size={14} style={{ color: 'var(--color-jade-500)' }} />
            <span className="t-label" style={{ color: 'var(--text-body)' }}>
              Rumus sah. Dengan angka contoh hasilnya{' '}
              <strong className="tnum" style={{ color: 'var(--text-strong)' }}>
                {rupiah(cek.contoh)}
              </strong>
            </span>
          </div>
        ) : (
          <div
            className="flex items-start gap-2 rounded-lg px-2.5 py-1.5"
            style={{ background: 'rgb(168 90 79 / .12)' }}
          >
            <CircleAlert size={14} className="mt-px shrink-0" style={{ color: 'var(--color-clay-500)' }} />
            <span className="t-label" style={{ color: 'var(--color-clay-500)' }}>
              {cek.pesan}
              {cek.pos !== undefined && ` (posisi ${cek.pos + 1})`}
            </span>
          </div>
        )}
      </div>

      {/* pemilih variabel, fungsi, dan contoh siap pakai */}
      <div className="glass-thin mt-2 overflow-hidden !rounded-xl">
        <div className="flex border-b" style={{ borderColor: 'var(--hairline)' }}>
          {(
            [
              ['variabel', 'Variabel'],
              ['fungsi', 'Fungsi'],
              ['contoh', 'Contoh siap pakai'],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className="t-label px-3 py-2 transition-colors"
              style={{
                color: tab === k ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: tab === k ? '2px solid var(--accent)' : '2px solid transparent',
                fontWeight: tab === k ? 600 : 500,
              }}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="scroll-slim max-h-44 overflow-y-auto p-2">
          {tab === 'variabel' && (
            <ul className="space-y-0.5">
              {VARIABEL.map((v) => (
                <li key={v.key}>
                  <button
                    type="button"
                    onClick={() => sisip(v.key)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--field-bg)]"
                  >
                    <Plus size={11} style={{ color: 'var(--text-muted)' }} />
                    <code className="t-micro font-mono" style={{ color: 'var(--accent)' }}>
                      {v.key}
                    </code>
                    <span className="t-micro flex-1 truncate">{v.label}</span>
                    <span className="tnum t-micro">{v.contoh}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {tab === 'fungsi' && (
            <ul className="space-y-0.5">
              {FUNGSI.map((f) => (
                <li key={f.key}>
                  <button
                    type="button"
                    onClick={() => sisip(`${f.key}(`)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--field-bg)]"
                  >
                    <Plus size={11} style={{ color: 'var(--text-muted)' }} />
                    <code className="t-micro font-mono" style={{ color: 'var(--accent)' }}>
                      {f.sig}
                    </code>
                    <span className="t-micro flex-1 truncate">{f.label}</span>
                  </button>
                </li>
              ))}
              <li className="px-2 pt-1.5">
                <span className="t-micro">
                  Operator: + − * / % ^ dan pembanding &gt; &lt; &gt;= &lt;= = ≠. Pemisah argumen
                  memakai titik koma.
                </span>
              </li>
            </ul>
          )}

          {tab === 'contoh' && (
            <ul className="space-y-0.5">
              {CONTOH.map((c) => (
                <li key={c.label}>
                  <button
                    type="button"
                    onClick={() => setSrc(c.rumus)}
                    className="w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--field-bg)]"
                  >
                    <span className="t-label block" style={{ color: 'var(--text-strong)' }}>
                      {c.label}
                    </span>
                    <code className="t-micro block font-mono" style={{ color: 'var(--accent)' }}>
                      {c.rumus}
                    </code>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
