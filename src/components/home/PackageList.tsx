import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getPackages } from '@/app/actions';
import AnimatedSection from '@/components/ui/AnimatedSection';
import ShareButton from '@/components/ui/ShareButton';
import { ArrowRight } from 'lucide-react';

const PackageList: React.FC = async () => {
  const packages = await getPackages();

  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">

        {/* Section header */}
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-2">Health Packages</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Our Most Popular Packages</h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
            Evidence-based screening bundles curated by our medical team to give you the clearest picture of your health.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {packages.map((pkg, idx) => (
            <AnimatedSection key={`${pkg.id}-${idx}`} animation="fadeIn" delay={idx * 80}>
              <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full hover:-translate-y-1.5">

                {/* Image */}
                <div className="h-52 overflow-hidden relative">
                  <Image
                    src={pkg.imageUrl || '/placeholder.jpg'}
                    alt={pkg.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-primary text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                      {pkg.category?.name ?? 'Wellness'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-7 flex flex-col flex-grow">
                  <h4 className="text-lg font-bold text-gray-900 mb-2 leading-snug">{pkg.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed mb-5 flex-grow line-clamp-3">
                    {pkg.description}
                  </p>
                  <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-extrabold text-gray-900">
                        {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(pkg.price))}
                      </p>
                      <ShareButton slug={pkg.slug} title={pkg.title} />
                    </div>
                    <Link
                      href={`/package/${pkg.slug}`}
                      className="flex items-center justify-center gap-2 w-full bg-primary text-white font-semibold py-3 rounded-full hover:bg-[#8a3a7a] transition-all duration-300 hover:shadow-md text-sm group/btn"
                    >
                      View Package
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/category/all"
            className="inline-flex items-center gap-2 border-2 border-primary text-primary px-8 py-3.5 rounded-full font-semibold hover:bg-primary hover:text-white transition-all duration-300 text-sm sm:text-base group"
          >
            View All Packages
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PackageList;
