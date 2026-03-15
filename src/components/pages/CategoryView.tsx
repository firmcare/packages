
'use client';

import React from 'react';
import { PACKAGES } from '@/lib/constants';
import { Package } from '@/lib/types';
import Link from 'next/link';
import ShareButton from '@/components/ui/ShareButton';

interface CategoryViewProps {
  category: string;
}

const CategoryView: React.FC<CategoryViewProps> = ({ category }) => {
  const isAllPackages = category.toLowerCase() === 'all packages' || category.toLowerCase() === 'all';
  const displayCategoryName = isAllPackages ? 'All Packages' : category;
  const displayPackages = isAllPackages ? PACKAGES : PACKAGES.slice(0, 3);

  const renderPackageCard = (pkg: Package, idx: number) => (
    <div key={`${pkg.id}-${idx}`} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group">
      <div className="h-64 overflow-hidden relative">
        <img
          src={pkg.imageUrl}
          alt={pkg.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
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
          <Link
            href="/"
            className="text-gray-500 hover:text-[#9d4496] hover:underline transition-colors font-medium"
          >
            Home
          </Link>
          <span className="text-gray-400">&gt;</span>
          <span className="text-[#9d4496] font-bold capitalize">{displayCategoryName}</span>
        </div>

        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 capitalize">{displayCategoryName}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayPackages.map((pkg, idx) => renderPackageCard(pkg, idx))}
            {!isAllPackages && displayPackages.length === 0 && (
              <p>No packages found for this category.</p>
            )}
          </div>

          {!isAllPackages && (
            <div className="mt-12 text-center">
              <Link
                href="/category/all"
                className="inline-block border border-primary-light text-[#9d4496] px-10 py-3 rounded-full font-bold hover:bg-pink-50 transition-colors"
              >
                View all packages
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryView;
