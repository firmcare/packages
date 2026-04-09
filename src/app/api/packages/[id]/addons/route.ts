import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get the IDs of tests already in this package
  const pkg = await prisma.package.findUnique({
    where: { id },
    select: { tests: { select: { id: true } } },
  });

  if (!pkg) return new NextResponse('Not found', { status: 404 });

  const existingTestIds = pkg.tests.map((t) => t.id);

  // Return tests with price > 0 not already in the package
  const addons = await prisma.test.findMany({
    where: {
      price: { gt: 0 },
      ...(existingTestIds.length > 0 && { id: { notIn: existingTestIds } }),
    },
    select: { id: true, name: true, price: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(
    addons.map((a) => ({ id: a.id, name: a.name, price: Number(a.price) }))
  );
}
