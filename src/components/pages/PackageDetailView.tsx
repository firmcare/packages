'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { ShoppingCart, Plus, X, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import ShareButton from '@/components/ui/ShareButton';
import { useAnalytics } from '@/hooks/useAnalytics';
import { fmtNgn as fmt } from '@/lib/format';

type PackageCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
};

type PackageWithRelations = PackageCard & {
  tests: Array<{ id: string; name: string }>;
};

type Addon = { id: string; name: string; price: number };

interface PackageDetailViewProps {
  packageData: PackageWithRelations;
  similarPackages: PackageCard[];
}

const PackageDetailView: React.FC<PackageDetailViewProps> = ({ packageData, similarPackages }) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const { track } = useAnalytics();

  const [showAddonsModal, setShowAddonsModal] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());

  // Fetch addons only when modal is open (null key = disabled)
  const { data: availableAddons = [], isLoading: addonLoading } = useSWR<Addon[]>(
    showAddonsModal ? `/api/packages/${packageData.id}/addons` : null,
  );

  // Fire package_viewed once on mount
  useEffect(() => {
    track('package_viewed', {
      package_id: packageData.id,
      package_title: packageData.title,
      package_price: Number(packageData.price),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleAddon = (id: string) =>
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedAddons = availableAddons.filter((a) => selectedAddonIds.has(a.id));
  const addonsTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const totalPrice = Number(packageData.price) + addonsTotal;

  const buildCartItem = () => ({
    id: packageData.id,
    slug: packageData.slug,
    title: packageData.title,
    description: packageData.description,
    price: fmt(totalPrice),
    imageUrl: packageData.imageUrl || '',
    selectedAddons: selectedAddons.length > 0 ? selectedAddons : undefined,
  });

  const handleBookNow = () => {
    track('checkout_started', { total: totalPrice, item_count: 1 });
    addToCart(buildCartItem());
    router.push('/checkout');
  };

  const handleAddToCart = () => {
    track('add_to_cart', {
      package_id: packageData.id,
      package_title: packageData.title,
      package_price: totalPrice,
    });
    addToCart(buildCartItem());
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-12 flex-wrap">
          <Link href="/" className="text-gray-500 hover:text-primary hover:underline transition-colors font-medium">Home</Link>
          <span className="text-gray-400">&gt;</span>
          <Link href="/packages" className="text-gray-500 hover:text-primary hover:underline transition-colors font-medium">Packages</Link>
          <span className="text-gray-400">&gt;</span>
          <span className="text-primary font-bold truncate max-w-[200px] md:max-w-none">{packageData.title}</span>
        </div>

        {/* Main Details */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-8 lg:gap-12 mb-20">
          {/* Image */}
          <div className="w-full lg:w-1/2 h-80 lg:h-120 rounded-3xl overflow-hidden relative">
            <Image
              src={packageData.imageUrl || '/placeholder.jpg'}
              alt={packageData.title}
              fill priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          {/* Info */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{packageData.title}</h1>
            <p className="text-primary text-base leading-relaxed mb-6">{packageData.description}</p>

            {packageData.tests && packageData.tests.length > 0 && (
              <div className="mb-6">
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

            {/* Add-ons trigger */}
            <div className="mb-6">
              <button
                onClick={() => setShowAddonsModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-dashed border-primary/40 text-primary text-sm font-semibold hover:border-primary hover:bg-purple-50 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add-on Tests
                {selectedAddons.length > 0 && (
                  <span className="ml-1 bg-primary text-white text-xs font-bold rounded-full px-2 py-0.5">
                    {selectedAddons.length}
                  </span>
                )}
              </button>
              {selectedAddons.length > 0 && (
                <div className="mt-3 pl-2 space-y-1">
                  {selectedAddons.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                        {a.name}
                      </span>
                      <span className="text-gray-500 font-medium">{fmt(a.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price + Actions */}
            <div className="mt-auto pt-6 border-t border-gray-100">
              <div className="mb-4">
                {selectedAddons.length > 0 ? (
                  <>
                    <p className="text-sm text-gray-400 line-through">{fmt(Number(packageData.price))}</p>
                    <h2 className="text-2xl font-bold text-gray-900">{fmt(totalPrice)}</h2>
                    <p className="text-xs text-primary mt-0.5">Includes {selectedAddons.length} add-on{selectedAddons.length > 1 ? 's' : ''} (+{fmt(addonsTotal)})</p>
                  </>
                ) : (
                  <h2 className="text-2xl font-bold text-gray-900">{fmt(Number(packageData.price))}</h2>
                )}
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <button onClick={handleBookNow} className="bg-primary text-white px-10 py-3 rounded-full font-bold hover:bg-[#8a3a7a] transition-colors shadow-md w-full md:w-auto">
                  Book Now
                </button>
                <button onClick={handleAddToCart} className="border-2 border-primary text-primary px-8 py-3 rounded-full font-bold hover:bg-pink-50 transition-colors shadow-sm w-full md:w-auto flex items-center justify-center gap-2 group">
                  <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Add to Cart
                </button>
                <ShareButton slug={packageData.slug} title={packageData.title} variant="icon" className="w-12 h-12 bg-primary/10 hover:bg-primary/20 text-primary rounded-full flex items-center justify-center shadow-sm transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Similar Packages */}
        <div>
          <h3 className="text-3xl font-bold text-gray-900 mb-8">Similar Packages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {similarPackages.map((pkg, idx) => (
              <div key={idx} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-gray-100 flex flex-col">
                <div className="h-64 overflow-hidden relative">
                  <Image
                    src={pkg.imageUrl || '/placeholder.jpg'}
                    alt={pkg.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-center transform hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">{pkg.title}</h4>
                  <p className="text-purple-900/70 text-sm leading-relaxed mb-4 flex-grow">{pkg.description}</p>
                  <div className="mt-auto">
                    <p className="text-lg font-bold text-gray-900 mb-6">{fmt(Number(pkg.price))}</p>
                    <Link href={`/package/${pkg.slug}`} className="block text-center w-full border border-purple-200 text-gray-700 font-bold py-3 rounded-full hover:bg-purple-50 hover:text-purple-900 transition-colors">
                      View Package
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/packages" className="inline-block border border-[#d68bb1] text-primary px-10 py-3 rounded-full font-bold hover:bg-pink-50 transition-colors">
              View all packages
            </Link>
          </div>
        </div>
      </div>

      {/* Add-ons Modal */}
      {showAddonsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90dvh]">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add-on Tests</h3>
                <p className="text-xs text-gray-500 mt-0.5">Select additional tests to include with this package</p>
              </div>
              <button onClick={() => setShowAddonsModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {addonLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm">Loading available tests…</span>
                </div>
              ) : availableAddons.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No additional tests available for this package.</div>
              ) : (
                <div className="space-y-2">
                  {availableAddons.map((addon) => {
                    const checked = selectedAddonIds.has(addon.id);
                    return (
                      <label
                        key={addon.id}
                        className={`flex items-center justify-between gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                          checked ? 'border-primary bg-purple-50' : 'border-gray-100 hover:border-primary/30 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative flex items-center shrink-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAddon(addon.id)}
                              className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 checked:border-primary checked:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                          </div>
                          <span className="text-sm font-medium text-gray-800 truncate">{addon.name}</span>
                        </div>
                        <span className="text-sm font-bold text-primary whitespace-nowrap shrink-0">{fmt(addon.price)}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl shrink-0">
              {selectedAddons.length > 0 && (
                <div className="flex items-center justify-between text-sm mb-3 px-1">
                  <span className="text-gray-500">{selectedAddons.length} add-on{selectedAddons.length > 1 ? 's' : ''} selected</span>
                  <span className="font-bold text-primary">+{fmt(addonsTotal)}</span>
                </div>
              )}
              <button
                onClick={() => setShowAddonsModal(false)}
                className="w-full bg-primary text-white py-3 rounded-full font-bold hover:bg-[#8a3a7a] transition-colors"
              >
                {selectedAddons.length > 0 ? `Confirm — ${fmt(totalPrice)}` : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageDetailView;
