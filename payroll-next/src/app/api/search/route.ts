import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, canManage } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || !canManage(session.role)) {
    return NextResponse.json([], { status: 403 });
  }

  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json([]);

  const rows = await prisma.employee.findMany({
    where: {
      OR: [
        { fullName: { contains: q } },
        { employeeNo: { contains: q } },
        { email: { contains: q } },
      ],
    },
    select: {
      id: true,
      fullName: true,
      employeeNo: true,
      position: { select: { title: true } },
      department: { select: { name: true } },
    },
    take: 6,
    orderBy: { fullName: 'asc' },
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      employeeNo: r.employeeNo,
      position: r.position?.title ?? null,
      department: r.department?.name ?? null,
    })),
  );
}
