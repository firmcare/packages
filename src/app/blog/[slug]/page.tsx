import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import BlogComments from '@/components/blog/BlogComments';
import BlogShareButtons from '@/components/blog/BlogShareButtons';
import { Calendar, User } from 'lucide-react';

type Props = { params: Promise<{ slug: string }> };

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://firmcare.com.ng';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug, isPublished: true } });
  if (!post) return { title: 'Post Not Found' };
  const postUrl = `${siteUrl}/blog/${slug}`;
  return {
    title: `${post.title} — FirmCare Blog`,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      url: postUrl,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      images: post.coverImage ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImage ? [post.coverImage] : [],
    },
    alternates: { canonical: postUrl },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const [post, otherPosts] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { slug, isPublished: true },
      include: { author: { select: { name: true } } },
    }),
    prisma.blogPost.findMany({
      where: { isPublished: true, slug: { not: slug } },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: { slug: true, title: true, excerpt: true, coverImage: true, publishedAt: true, author: { select: { name: true } } },
    }),
  ]);

  if (!post) notFound();

  const postUrl = `${siteUrl}/blog/${slug}`;
  const fmt = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.coverImage ?? undefined,
    url: postUrl,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { '@type': 'Person', name: post.author?.name ?? 'FirmCare' },
    publisher: {
      '@type': 'Organization',
      name: 'FirmCare',
      url: siteUrl,
    },
  };

  return (
    <div className="bg-white min-h-screen pb-20 animate-fadeIn">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Cover image */}
      {post.coverImage && (
        <div className="relative w-full h-64 sm:h-80 bg-gray-100">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority sizes="100vw" />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-8">
          <Link href="/" className="text-gray-400 hover:text-primary transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          <Link href="/blog" className="text-gray-400 hover:text-primary transition-colors">Blog</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 truncate">{post.title}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-3 flex items-center gap-3">
              {post.publishedAt && (
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{fmt(post.publishedAt)}</span>
              )}
              {post.author?.name && (
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{post.author.name}</span>
              )}
            </p>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">{post.title}</h1>

            {post.excerpt && (
              <p className="text-lg text-gray-500 leading-relaxed mb-8 border-l-4 border-primary pl-4">{post.excerpt}</p>
            )}

            <hr className="border-gray-100 mb-8" />

            <article
              className="prose prose-lg prose-headings:text-gray-900 prose-a:text-primary prose-img:rounded-2xl max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <hr className="border-gray-100 my-12" />

            <BlogShareButtons url={postUrl} title={post.title} />

            <hr className="border-gray-100 my-12" />

            <BlogComments slug={slug} />

            <div className="mt-12">
              <Link href="/blog" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm">
                ← Back to Blog
              </Link>
            </div>
          </div>

          {/* ── Sidebar ── */}
          {otherPosts.length > 0 && (
            <aside className="w-full lg:w-72 shrink-0">
              <div className="sticky top-24">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">More Posts</h2>
                <div className="space-y-5">
                  {otherPosts.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/blog/${p.slug}`}
                      className="group flex gap-3 items-start"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        {p.coverImage ? (
                          <Image
                            src={p.coverImage}
                            alt={p.title}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold text-lg">{p.title[0]}</span>
                          </div>
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {p.title}
                        </p>
                        {p.publishedAt && (
                          <p className="text-xs text-gray-400 mt-1">{fmt(p.publishedAt)}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                <Link
                  href="/blog"
                  className="mt-6 block text-center text-sm font-semibold text-primary border border-primary/30 rounded-xl py-2.5 hover:bg-primary/5 transition-colors"
                >
                  View all posts
                </Link>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
