/**
 * Pembuat CSV yang ramah Excel Indonesia.
 *
 * Dua hal yang gampang salah dan sudah ditangani di sini:
 *  · Excel di locale Indonesia memakai ';' sebagai pemisah kolom
 *  · tanpa BOM UTF-8, nama berhuruf non-ASCII berantakan saat dibuka
 */

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v);
    // tanda kutip, pemisah, dan baris baru harus dibungkus
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [headers.map(escape).join(';')];
  for (const r of rows) lines.push(r.map(escape).join(';'));
  return '﻿' + lines.join('\r\n');
}

export function csvResponse(filename: string, body: string): Response {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
