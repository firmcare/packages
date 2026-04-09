import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import { Mail, UserCircle2 } from 'lucide-react';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://firmcare.com.ng';

export const metadata: Metadata = {
  title: 'Our Team — FirmCare Diagnostics',
  description: 'Meet the dedicated medical professionals and management team behind FirmCare Health Diagnostics in Abuja, Nigeria.',
  keywords: ['FirmCare team', 'medical professionals Abuja', 'diagnostic centre staff', 'FirmCare management', 'healthcare team Nigeria'],
  openGraph: {
    title: 'Our Team — FirmCare Diagnostics',
    description: 'Meet the dedicated professionals behind FirmCare Health Diagnostics in Abuja.',
    url: `${siteUrl}/team`,
    type: 'website',
    images: [{ url: `${siteUrl}/og-image.jpg`, width: 1200, height: 630, alt: 'FirmCare Management Team' }],
  },
  twitter: { card: 'summary_large_image', title: 'Our Team — FirmCare Diagnostics', description: 'Meet the dedicated professionals behind FirmCare Health Diagnostics.', images: [`${siteUrl}/og-image.jpg`] },
  alternates: { canonical: `${siteUrl}/team` },
};

export default async function TeamPage() {
  const members = await prisma.teamMember.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FirmCare Diagnostics',
    url: siteUrl,
    member: members.map((m) => ({
      '@type': 'Person',
      name: m.name,
      jobTitle: m.position,
      ...(m.email ? { email: m.email } : {}),
      ...(m.image ? { image: m.image } : {}),
      worksFor: { '@type': 'Organization', name: 'FirmCare Diagnostics' },
    })),
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero */}
      <div className="bg-linear-to-r from-[#7b2d72] via-[#9d4496] to-[#c45fad] py-14 px-4 text-center text-white">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">Our Team</h1>
        <p className="text-white/80 text-base max-w-xl mx-auto">
          Meet the dedicated professionals committed to delivering precision diagnostics and exceptional care.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {members.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">Team information coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {members.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col items-center text-center p-8 hover:shadow-md transition-shadow"
              >
                {/* Photo */}
                <div className="w-28 h-28 rounded-full overflow-hidden bg-primary/10 mb-5 shrink-0 ring-4 ring-primary/10">
                  {m.image ? (
                    <Image
                      src={m.image}
                      alt={m.name}
                      width={112}
                      height={112}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserCircle2 className="w-14 h-14 text-primary/30" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <h2 className="text-lg font-bold text-gray-900 mb-1">{m.name}</h2>
                <p className="text-sm font-semibold text-primary mb-3">{m.position}</p>

                {m.email && (
                  <a
                    href={`mailto:${m.email}`}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {m.email}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
