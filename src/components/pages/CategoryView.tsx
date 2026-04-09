'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FlaskConical, ArrowRight } from 'lucide-react';
import ShareButton from '@/components/ui/ShareButton';

interface PackageItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: string;
  imageUrl: string | null;
  category: string;
}

interface CategoryViewProps {
  category: string;
  packages: PackageItem[];
}

const CategoryView: React.FC<CategoryViewProps> = ({ category, packages }) => {
  const isAllPackages = category.toLowerCase() === 'all packages' || category.toLowerCase() === 'all';
  const displayCategoryName = isAllPackages ? 'All Packages' : category;

  const renderPackageCard = (pkg: PackageItem, idx: number) => (
    <div key={`${pkg.id}-${idx}`} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group">
      <div className="h-64 overflow-hidden relative">
        <Image
          src={pkg.imageUrl || '/placeholder.jpg'}
          alt={pkg.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-6 flex flex-col grow">
        <h4 className="text-xl font-bold text-gray-900 mb-3">{pkg.title}</h4>
        <p className="text-[#9d4496] opacity-80 text-sm leading-relaxed mb-6 grow">
          {pkg.description}
        </p>
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-6">
            <p className="text-lg font-bold text-gray-900">{pkg.price}</p>
            <ShareButton slug={pkg.slug} title={pkg.title} />
          </div>
          <Link
            href={`/package/${pkg.slug}`}
            className="block text-center w-full border border-purple-200 text-gray-700 font-bold py-3 rounded-full hover:bg-purple-50 hover:text-purple-900 transition-colors"
          >
            View Package
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-20 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-12">
          <Link href="/" className="text-gray-500 hover:text-[#9d4496] hover:underline transition-colors font-medium">
            Home
          </Link>
          <span className="text-gray-400">&gt;</span>
          <span className="text-[#9d4496] font-bold capitalize">{displayCategoryName}</span>
        </div>

        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 capitalize">{displayCategoryName}</h2>

          {packages.length === 0 ? (
            <p className="text-gray-500">No packages found{!isAllPackages ? ` in this category` : ""}.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packages.map((pkg, idx) => renderPackageCard(pkg, idx))}
            </div>
          )}

          {!isAllPackages && (
            <div className="mt-12 text-center">
              <Link
                href="/packages"
                className="inline-block border border-primary-light text-[#9d4496] px-10 py-3 rounded-full font-bold hover:bg-pink-50 transition-colors"
              >
                View all packages
              </Link>
            </div>
          )}
        </div>

        {/* Custom Package Banner */}
        {isAllPackages && (
          <div className="mb-16 rounded-3xl overflow-hidden bg-linear-to-r from-[#7b2d72] via-[#9d4496] to-[#c45fad] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-lg">
            <div className="flex items-center gap-6 text-white">
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <FlaskConical className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Can&apos;t find what you need?</h3>
                <p className="text-white/80 text-sm leading-relaxed max-w-md">
                  Build your own custom diagnostic package — handpick individual tests and pay only for what you need.
                </p>
              </div>
            </div>
            <Link
              href="/custom-package"
              className="shrink-0 flex items-center gap-2 bg-white text-[#9d4496] px-8 py-3.5 rounded-full font-bold hover:bg-purple-50 transition-colors shadow-md whitespace-nowrap"
            >
              Build Your Package
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryView;
