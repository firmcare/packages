import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const postSchema = z.object({
  title: z.string().min(3),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  coverImage: z.string().optional(),
  isPublished: z.boolean().default(false),
});

async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const role = session.user.role as string;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') return null;
  return session;
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, slug: true, excerpt: true,
      coverImage: true, isPublished: true, publishedAt: true,
      createdAt: true, updatedAt: true,
      author: { select: { name: true, email: true } },
      _count: { select: { comments: true } },
    },
  });
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json();
  const data = postSchema.parse(body);

  const baseSlug = data.slug ? slugify(data.slug) : slugify(data.title);
  // Ensure slug uniqueness
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.blogPost.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const post = await prisma.blogPost.create({
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt ?? null,
      content: data.content,
      coverImage: data.coverImage ?? null,
      isPublished: data.isPublished,
      publishedAt: data.isPublished ? new Date() : null,
      authorId: session.user.id,
    },
  });
  return NextResponse.json(post, { status: 201 });
}
