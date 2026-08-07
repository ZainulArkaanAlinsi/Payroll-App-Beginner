import { Check } from 'lucide-react';

export interface Langkah {
  key: string;
  label: string;
  catatan?: string;
}

/**
 * Penanda kemajuan tahap.
 *
 * Dipakai di halaman proses gaji supaya posisi periode terlihat sekali
 * pandang — sebelumnya HR harus menebaknya dari satu chip status kecil
 * dan dari tombol mana yang kebetulan muncul.
 */
export default function Stepper({
  langkah,
  aktifIndex,
}: {
  langkah: Langkah[];
  /** indeks tahap yang sedang berjalan; tahap sebelumnya dianggap selesai */
  aktifIndex: number;
}) {
  return (
    <ol className="flex flex-wrap items-stretch gap-0">
      {langkah.map((l, i) => {
        const selesai = i < aktifIndex;
        const kini = i === aktifIndex;
        const warna = selesai
          ? 'var(--color-jade-500)'
          : kini
            ? 'var(--accent)'
            : 'var(--text-muted)';

        return (
          <li key={l.key} className="flex min-w-[8.5rem] flex-1 items-start gap-2.5 py-1">
            <span className="flex flex-col items-center self-stretch">
              <span
                className="grid size-6 shrink-0 place-items-center rounded-full"
                style={{
                  background: selesai
                    ? 'var(--color-jade-500)'
                    : kini
                      ? 'var(--accent-soft)'
                      : 'var(--field-bg)',
                  color: selesai ? '#fff' : warna,
                  border: kini ? '1.5px solid var(--accent)' : '1px solid var(--hairline)',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                }}
              >
                {selesai ? <Check size={12} /> : i + 1}
              </span>
              {/* garis penghubung; tahap terakhir tidak perlu ekor */}
              {i < langkah.length - 1 && (
                <span
                  className="mt-1 w-px flex-1"
                  style={{ background: selesai ? 'var(--color-jade-500)' : 'var(--hairline)' }}
                  aria-hidden
                />
              )}
            </span>

            <span className="min-w-0 pb-2">
              <span
                className="block t-label"
                style={{ color: kini || selesai ? 'var(--text-strong)' : 'var(--text-muted)', fontWeight: kini ? 650 : 550 }}
              >
                {l.label}
              </span>
              {l.catatan && <span className="block t-micro leading-snug">{l.catatan}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
