import Image from 'next/image';
import { Mail } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const revalidate = 60;

export const metadata = {
  title: 'Our Management Team | FirmCare Diagnostics',
  description:
    'Meet the medical professionals and management team behind FirmCare Diagnostics & Medical Services.',
};

export default async function OurTeamPage() {
  const members = await prisma.teamMember.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });

  return (
    <main>
      {/* ── Hero banner ── */}
      <section className="bg-[#f3edf7] py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-0.5 bg-primary block" />
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
              Meet Our Team
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-gray-700 mb-6">
            Our Management <span className="font-bold text-gray-800">Team</span>
          </h1>
          <p className="text-gray-600 max-w-2xl leading-relaxed">
            Our team is made up of medical doctors, gastroenterologists, radiologists, pathologists
            and laboratory scientists. We take great care and pleasure in selecting the finest
            individuals to work with us, both on administrative and technical levels, utilizing
            state-of-the-art certified equipment and reagents. No time or effort has been spared in
            the training process of all our personnel.
          </p>
        </div>
      </section>

      {/* ── Team grid ── */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {members.length === 0 ? (
            <p className="text-center text-gray-400 py-24">Team information coming soon.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="bg-white text-center rounded-2xl shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300"
                >
                  {/* Photo */}
                  <div className="relative w-full aspect-[3/4] bg-gray-100">
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-purple-50">
                        <span className="text-5xl font-bold text-primary/30 select-none">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="px-5 py-5 flex flex-col flex-1">
                    <h3 className="font-semibold text-gray-800 text-base leading-snug">
                      {member.name}
                    </h3>
                    <p className="text-primary text-sm mt-1">{member.position}</p>

                    {member.email && (
                      <div className="mt-auto pt-4 border-t border-gray-100">
                        <a
                          href={`mailto:${member.email}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-gray-400 hover:text-primary hover:border-primary transition-colors"
                          aria-label={`Email ${member.name}`}
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      </div>
                    )}

                    {!member.email && (
                      <div className="mt-auto pt-4 border-t border-gray-100">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-100 text-gray-200">
                          <Mail className="w-4 h-4" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
