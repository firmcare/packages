import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const role = session.user.role as string;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') return null;
  return session;
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });
  const { id } = await params;
  await prisma.blogComment.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
