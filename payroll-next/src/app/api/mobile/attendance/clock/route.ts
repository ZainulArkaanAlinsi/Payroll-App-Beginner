import { bad, jsonBody, ok, preflight, withEmployee } from '@/lib/api';
import { absen, absensiHariIni } from '@/lib/self-service';

export const OPTIONS = preflight;

export async function POST(req: Request) {
  return withEmployee(req, async (aktor) => {
    const body = await jsonBody<{ kind?: string }>(req);
    const kind = body?.kind;
    if (kind !== 'IN' && kind !== 'OUT') return bad('Jenis absen harus IN atau OUT.');

    const hasil = await absen(aktor, kind);
    if (!hasil.ok) return bad(hasil.error ?? 'Absen gagal.');

    // Kirim balik keadaan terbaru supaya layar tidak perlu memuat ulang.
    return ok({ pesan: hasil.message, hariIni: await absensiHariIni(aktor.employeeId) });
  });
}
