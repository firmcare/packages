export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://firmcare.com.ng';

export const metadata: Metadata = {
  title: 'Blog — FirmCare Diagnostics',
  description: 'Health tips, diagnostic guides, and news from the FirmCare team.',
  keywords: ['health tips', 'diagnostics blog', 'medical guides', 'FirmCare news', 'Abuja health', 'laboratory tests Nigeria'],
  openGraph: {
    title: 'Blog — FirmCare Diagnostics',
    description: 'Health tips, diagnostic guides, and news from the FirmCare team.',
    url: `${siteUrl}/blog`,
    type: 'website',
    images: [{ url: `${siteUrl}/og-image.jpg`, width: 1200, height: 630, alt: 'FirmCare Blog' }],
  },
  twitter: { card: 'summary_large_image', title: 'Blog — FirmCare Diagnostics', description: 'Health tips, diagnostic guides, and news from the FirmCare team.', images: [`${siteUrl}/og-image.jpg`] },
  alternates: { canonical: `${siteUrl}/blog` },
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true, title: true, slug: true, excerpt: true,
      coverImage: true, publishedAt: true,
      author: { select: { name: true } },
    },
  });

  const fmt = (d: Date | string) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'FirmCare Blog',
    description: 'Health tips, diagnostic guides, and news from the FirmCare team.',
    url: `${siteUrl}/blog`,
    publisher: { '@type': 'Organization', name: 'FirmCare', url: siteUrl },
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.excerpt ?? undefined,
      url: `${siteUrl}/blog/${p.slug}`,
      image: p.coverImage ?? undefined,
      datePublished: p.publishedAt,
      author: { '@type': 'Person', name: p.author?.name ?? 'FirmCare' },
    })),
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 animate-fadeIn">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Header */}
      <div className="bg-linear-to-r from-[#7b2d72] via-[#9d4496] to-[#c45fad] py-14 px-4 text-center text-white">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">Our Blog</h1>
        <p className="text-white/80 text-base max-w-xl mx-auto">
          Health insights, diagnostic tips, and updates from the FirmCare team.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl font-semibold mb-2">No posts yet</p>
            <p className="text-sm">Check back soon for health tips and updates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
                <div className="relative h-52 bg-purple-100 overflow-hidden shrink-0">
                  {post.coverImage ? (
                    <Image src={post.coverImage} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-[#9d4496]/20 to-[#c45fad]/10 flex items-center justify-center">
                      <span className="text-5xl">📋</span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-xs text-gray-400 mb-2">
                    {post.publishedAt ? fmt(post.publishedAt) : ''}
                    {post.author?.name ? ` · ${post.author.name}` : ''}
                  </p>
                  <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h2>
                  {post.excerpt && (
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1">{post.excerpt}</p>
                  )}
                  <span className="mt-4 text-sm font-semibold text-primary group-hover:underline">Read more →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
