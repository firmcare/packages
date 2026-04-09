import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  coverImage: z.string().optional(),
  isPublished: z.boolean().optional(),
});

async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const role = session.user.role as string;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') return null;
  return session;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) return new NextResponse('Not found', { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });
  const { id } = await params;

  const body = await req.json();
  const data = updateSchema.parse(body);

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) return new NextResponse('Not found', { status: 404 });

  // If publishing for the first time, set publishedAt
  const publishedAt =
    data.isPublished && !existing.isPublished ? new Date()
    : !data.isPublished ? null
    : existing.publishedAt;

  const post = await prisma.blogPost.update({
    where: { id },
    data: { ...data, publishedAt },
  });
  return NextResponse.json(post);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });
  const { id } = await params;
  await prisma.blogPost.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
