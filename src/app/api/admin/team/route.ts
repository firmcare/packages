import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  name:     z.string().min(1),
  position: z.string().min(1),
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

export async function GET() {
  const session = await requireAdmin();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });
  const members = await prisma.teamMember.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] });
  return NextResponse.json(members);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });
  const body = await req.json();
  const data = schema.parse(body);
  const member = await prisma.teamMember.create({
    data: {
      name:     data.name,
      position: data.position,
      email:    data.email || null,
      image:    data.image || null,
      order:    data.order ?? 0,
    },
  });
  return NextResponse.json(member, { status: 201 });
}
