
'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import ShareButton from '@/components/ui/ShareButton';

type PackageCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
};

type PackageWithRelations = PackageCard & {
  tests: Array<{
    id: string;
    name: string;
  }>;
};

interface PackageDetailViewProps {
  packageData: PackageWithRelations;
  similarPackages: PackageCard[];
}

const PackageDetailView: React.FC<PackageDetailViewProps> = ({ packageData, similarPackages }) => {
  const router = useRouter();
  const { addToCart } = useCart();

  // Convert database package to cart package format
  const toCartPackage = (pkg: PackageWithRelations | PackageCard) => ({
    id: pkg.id,
    slug: pkg.slug,
    title: pkg.title,
    description: pkg.description,
    price: new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(pkg.price)),
    imageUrl: pkg.imageUrl || '',
  });

  const handleBookNow = () => {
      addToCart(toCartPackage(packageData));
      router.push('/checkout');
  };

  const handleAddToCart = () => {
      addToCart(toCartPackage(packageData));
      // Optional: Toast or feedback
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-12 flex-wrap">
          <Link
            href="/"
            className="text-gray-500 hover:text-primary hover:underline transition-colors font-medium"
          >
            Home
          </Link>

          <span className="text-gray-400">&gt;</span>
          <Link
            href="/category/all"
            className="text-gray-500 hover:text-primary hover:underline transition-colors font-medium"
          >
            Packages
          </Link>

          <span className="text-gray-400">&gt;</span>
          <span className="text-primary font-bold truncate max-w-[200px] md:max-w-none">{packageData.title}</span>
        </div>

        {/* Main Details Section */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-8 lg:gap-12 mb-20">
          {/* Image */}
          <div className="w-full lg:w-1/2 h-80 lg:h-auto rounded-3xl overflow-hidden">
             <img
               src={packageData.imageUrl || '/placeholder.jpg'}
               alt={packageData.title}
               className="w-full h-full object-cover"
             />
          </div>

          {/* Info */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{packageData.title}</h1>
            <p className="text-primary text-base leading-relaxed mb-6">
              {packageData.description}
            </p>

            {packageData.tests && packageData.tests.length > 0 && (
              <div className="mb-8">
                <h4 className="text-primary font-medium mb-3">Tests Included:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  {packageData.tests.map((test, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                       <span className="text-green-600 mt-1">✓</span>
                       <span className="text-gray-700 text-sm">{test.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto pt-6">
               <h2 className="text-2xl font-bold text-gray-900 mb-4">
                 {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(packageData.price))}
               </h2>
               <div className="flex flex-col md:flex-row gap-4">
                 <button
                   onClick={handleBookNow}
                   className="bg-primary text-white px-10 py-3 rounded-full font-bold hover:bg-[#8a3a7a] transition-colors shadow-md w-full md:w-auto"
                 >
                    Book Now
                 </button>
                 <button
                   onClick={handleAddToCart}
                   className="border-2 border-primary text-primary px-8 py-3 rounded-full font-bold hover:bg-pink-50 transition-colors shadow-sm w-full md:w-auto flex items-center justify-center gap-2 group"
                 >
                    <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Add to Cart
                 </button>
                 <ShareButton slug={packageData.slug} title={packageData.title} variant="full" className="rounded-full" />
               </div>
            </div>
          </div>
        </div>

        {/* Similar Packages Section */}
        <div>
          <h3 className="text-3xl font-bold text-gray-900 mb-8">Similar Packages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {similarPackages.map((pkg, idx) => (
              <div key={idx} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-gray-100 flex flex-col">
                <div className="h-64 overflow-hidden relative">
                   <img
                    src={pkg.imageUrl || '/placeholder.jpg'}
                    alt={pkg.title}
                    className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">{pkg.title}</h4>
                  <p className="text-purple-900/70 text-sm leading-relaxed mb-4 flex-grow">
                    {pkg.description}
                  </p>
                  <div className="mt-auto">
                    <p className="text-lg font-bold text-gray-900 mb-6">
                      {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(pkg.price))}
                    </p>
                    <Link
                      href={`/package/${pkg.slug}`}
                      className="block text-center w-full border border-purple-200 text-gray-700 font-bold py-3 rounded-full hover:bg-purple-50 hover:text-purple-900 transition-colors"
                    >
                      View Package
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
             <Link
                href="/category/all"
                className="inline-block border border-[#d68bb1] text-primary px-10 py-3 rounded-full font-bold hover:bg-pink-50 transition-colors"
             >
                View all packages
             </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PackageDetailView;
