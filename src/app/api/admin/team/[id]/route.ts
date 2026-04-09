import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  name:     z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  email:    z.string().email().optional().or(z.literal('')),
  image:    z.string().optional(),
  order:    z.number().int().optional(),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const role = session.user.role as string;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') return null;
  return session;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const data = schema.parse(body);
  const member = await prisma.teamMember.update({
    where: { id },
    data: {
      ...data,
      email: data.email === '' ? null : data.email,
    },
  });
  return NextResponse.json(member);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });
  const { id } = await params;
  await prisma.teamMember.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
