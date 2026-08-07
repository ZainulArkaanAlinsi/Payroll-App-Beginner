import { prisma } from '@/lib/prisma';
import { canManage, getSession } from '@/lib/auth';
import { csvResponse } from '@/lib/csv';
import { labelPeriode } from '@/lib/format';

interface Kolom {
  header: string;
  source: string;
  prefix: string;
}

/**
 * Daftar transfer massal, disusun menurut format bank yang diracik HR.
 * Kolom, urutan, pemisah, dan baris judulnya semuanya mengikuti pengaturan —
 * itulah yang membuat berkas ini cocok untuk bank mana pun tanpa disunting.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canManage(session.role)) {
    return new Response('Tidak diizinkan', { status: 403 });
  }

  const { id } = await params;
  const run = await prisma.payrollRun.findUnique({ where: { id } });
  if (!run) return new Response('Proses gaji tidak ditemukan', { status: 404 });

  // ?format=<id> memilih format tertentu; tanpa itu dipakai yang bawaan.
  const formatId = new URL(req.url).searchParams.get('format');
  const format =
    (formatId ? await prisma.bankFormat.findUnique({ where: { id: formatId } }) : null) ??
    (await prisma.bankFormat.findFirst({ orderBy: { isDefault: 'desc' } }));

  if (!format) return new Response('Belum ada format transfer bank', { status: 404 });

  let kolom: Kolom[] = [];
  try {
    kolom = JSON.parse(format.columns);
  } catch {
    return new Response('Susunan kolom format ini rusak', { status: 500 });
  }
  if (kolom.length === 0) return new Response('Format ini belum punya kolom', { status: 400 });

  const items = await prisma.payrollItem.findMany({
    where: { runId: id },
    include: {
      employee: {
        select: {
          employeeNo: true,
          fullName: true,
          bankName: true,
          bankAccount: true,
          bankHolder: true,
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { employee: { employeeNo: 'asc' } },
  });

  const periode = labelPeriode(run.period).toUpperCase();

  const nilai = (
    kolomSource: string,
    it: (typeof items)[number],
    urut: number,
  ): string | number => {
    switch (kolomSource) {
      case 'rowNumber': return urut;
      case 'employeeNo': return it.employee.employeeNo;
      case 'fullName': return it.employee.fullName;
      case 'bankHolder': return it.employee.bankHolder ?? it.employee.fullName;
      case 'bankName': return it.employee.bankName ?? '';
      case 'bankAccount': return it.employee.bankAccount ?? '';
      case 'netPay': return it.netPay;
      case 'grossPay': return it.grossPay;
      case 'period': return periode;
      case 'department': return it.employee.department?.name ?? '';
      default: return '';
    }
  };

  const escape = (v: string | number, d: string) => {
    const s = String(v ?? '');
    // pemisah yang dipilih HR bisa apa saja, jadi pengutipan mengikutinya
    return s.includes(d) || /["\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const d = format.delimiter;
  const baris: string[] = [];
  if (format.includeHeader) baris.push(kolom.map((c) => escape(c.header, d)).join(d));

  items.forEach((it, i) => {
    baris.push(
      kolom.map((c) => escape(`${c.prefix ?? ''}${nilai(c.source, it, i + 1)}`, d)).join(d),
    );
  });

  // BOM UTF-8 supaya nama berhuruf non-ASCII tidak berantakan di Excel
  const body = '﻿' + baris.join('\r\n');
  const namaBerkas = `transfer-${format.name.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}-${run.period}.csv`;

  return csvResponse(namaBerkas, body);
}
