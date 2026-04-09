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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });
  const { id } = await params;

  const comments = await prisma.blogComment.findMany({
    where: { postId: id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, body: true, createdAt: true },
  });
  return NextResponse.json(comments);
}
