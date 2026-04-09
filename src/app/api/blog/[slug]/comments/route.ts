import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const commentSchema = z.object({
  name: z.string().min(1).max(100),
  body: z.string().min(1).max(2000),
});

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug, isPublished: true }, select: { id: true } });
  if (!post) return new NextResponse('Not found', { status: 404 });

  const comments = await prisma.blogComment.findMany({
    where: { postId: post.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, body: true, createdAt: true },
  });
  return NextResponse.json(comments);
}

export async function POST(req: Request, { params }: Ctx) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug, isPublished: true }, select: { id: true } });
  if (!post) return new NextResponse('Not found', { status: 404 });

  const body = await req.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) return new NextResponse('Invalid input', { status: 400 });

  const comment = await prisma.blogComment.create({
    data: { postId: post.id, ...parsed.data },
    select: { id: true, name: true, body: true, createdAt: true },
  });
  return NextResponse.json(comment, { status: 201 });
}
