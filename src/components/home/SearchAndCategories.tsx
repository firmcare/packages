
'use client';

import React, { useState } from 'react';
import { CATEGORIES, SEARCH_SUGGESTIONS, PACKAGES } from '@/lib/constants';
import { ChevronDown, ChevronUp, ShoppingCart, Sparkles } from 'lucide-react';
import { Package } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { useAnalytics } from '@/hooks/useAnalytics';

const SearchAndCategories: React.FC = () => {
  const router = useRouter();
  const { addToCart } = useCart();
  const { track } = useAnalytics();
  const [visibleCount, setVisibleCount] = useState(8);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const visibleCategories = CATEGORIES.slice(0, visibleCount);
  const hasMore = visibleCount < CATEGORIES.length;

  // Filter suggestions based on query for the dropdown
  const filteredSuggestions = SEARCH_SUGGESTIONS.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find the first match that STARTS with the query for inline autocomplete
  const inlineMatch = searchQuery 
    ? SEARCH_SUGGESTIONS.find(item => item.name.toLowerCase().startsWith(searchQuery.toLowerCase()))
    : null;

  const suggestionSuffix = inlineMatch ? inlineMatch.name.slice(searchQuery.length) : '';

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 8, CATEGORIES.length));
  };

  const handleShowLess = () => {
    setVisibleCount(8);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow user to accept suggestion with Tab or Right Arrow
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && inlineMatch && suggestionSuffix) {
      e.preventDefault();
      setSearchQuery(inlineMatch.name);
    }
  };

  const getPackageFromSuggestion = (name: string, price: string): Package => {
    // Check if it matches a real package
    const existing = PACKAGES.find(p => p.title.toLowerCase() === name.toLowerCase());
    if (existing) return existing;

    // Create a transient package
    const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
    return {
      id: `temp-${Date.now()}-${Math.random()}`,
      slug: slug || 'diagnostic-test',
      title: name,
      description: "Diagnostic test service available for booking.",
      price: price,
      imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800",
      includes: ["Sample collection", "Laboratory analysis", "Result report"]
    };
  };

  const handleAction = (action: 'book' | 'cart') => {
    const match = inlineMatch || SEARCH_SUGGESTIONS.find(s => s.name.toLowerCase() === searchQuery.toLowerCase());

    let pkg: Package | null = null;
    if (match) {
        pkg = getPackageFromSuggestion(match.name, match.price);
    } else if (searchQuery.trim()) {
        pkg = getPackageFromSuggestion(searchQuery, "Price on Request");
    }

    track('search_performed', { query: searchQuery.trim(), result_count: filteredSuggestions.length });

    if (pkg) {
        addToCart(pkg);
        if (action === 'book') {
            router.push('/checkout');
        }
    }
  };

  const handleCategorySelect = (category: string) => {
    if (category === 'Custom Package') {
        router.push('/custom-package');
    } else {
        const slug = category.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        router.push(`/category/${slug}`);
    }
  };

  const handleSuggestionClick = (name: string, price: string) => {
     const pkg = getPackageFromSuggestion(name, price);
     // Navigate to package details or just populate search?
     // Original app selected package. Let's populate search for now and allow adding to cart.
     // Or better: navigate to a search results page?
     // For now, let's just simulate selection by setting query
     setSearchQuery(name);
     setIsFocused(false);
  };

  return (
    <section id="find-a-test" className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 relative">

        {/* Section header */}
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-2">Search Our Catalogue</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Find the Right Test</h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
            Search from hundreds of diagnostic tests or browse by health category to find what&apos;s right for you.
          </p>
        </div>

        {/* Search Bar Container */}
        <div className="relative max-w-4xl mx-auto z-50 mb-12 sm:mb-16">
          <div className="bg-white rounded-3xl md:rounded-full p-3 md:p-2 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-3 md:gap-2 relative z-50">

            <div className="grow relative flex items-center">
              {/* Ghost Text Overlay */}
              <div className="absolute inset-0 px-4 sm:px-6 py-3 text-base sm:text-lg pointer-events-none whitespace-pre overflow-hidden flex items-center">
                <span className="opacity-0">{searchQuery}</span>
                <span className="text-gray-400 hidden sm:inline">{suggestionSuffix}</span>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                placeholder="Search for tests (e.g full blood count)"
                className="w-full bg-transparent px-4 sm:px-6 py-3 outline-none text-gray-800 placeholder-gray-400 text-base sm:text-lg rounded-full active:rounded-full relative z-10"
                autoComplete="on"
              />
            </div>

            <div className="flex gap-2 shrink-0">
               <button
                  onClick={() => handleAction('cart')}
                  className="bg-purple-100 text-primary px-4 sm:px-6 py-3 rounded-full font-bold hover:bg-purple-200 transition-colors flex items-center gap-2 justify-center flex-1 md:flex-initial text-sm sm:text-base"
                  title="Add to Cart"
               >
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="md:hidden">Cart</span>
               </button>
               <button
                  onClick={() => handleAction('book')}
                  className="bg-primary text-white px-6 sm:px-10 py-3 rounded-full font-bold hover:bg-[#8a3a7a] transition-colors flex-1 md:flex-initial text-sm sm:text-base"
               >
                  Book Now
               </button>
            </div>
          </div>

          {/* Autocomplete Dropdown - Only shows when focused AND has input */}
          {isFocused && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-xl border border-purple-50 overflow-hidden animate-fadeIn z-40 max-h-[60vh] overflow-y-auto">
              <div className="py-2">
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((item, index) => (
                    <div
                      key={index}
                      className="px-4 sm:px-8 py-3 sm:py-4 hover:bg-purple-50 cursor-pointer flex justify-between items-center transition-colors group border-b border-gray-50 last:border-0 gap-2"
                      onMouseDown={(e) => {
                         // Use onMouseDown to prevent blur from firing before click
                         e.preventDefault();
                         handleSuggestionClick(item.name, item.price);
                      }}
                    >
                      <span className="text-gray-700 font-medium text-sm sm:text-lg group-hover:text-primary truncate">{item.name}</span>
                      <span className="text-primary font-medium text-sm sm:text-lg shrink-0">{item.price}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 sm:px-8 py-4 sm:py-6 text-gray-500 text-center text-sm sm:text-base">
                    No tests found matching "{searchQuery}"
                  </div>
                )}
              </div>
              <div className="bg-white border-t border-gray-100 p-3 sm:p-4 text-center">
                <button
                    onClick={() => router.push('/packages')}
                    className="text-footer-bg font-bold underline underline-offset-4 hover:text-primary transition-colors text-xs sm:text-sm"
                >
                    View more results
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="mb-8 relative z-10">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Categories</h3>
          <div className="flex flex-wrap gap-2 sm:gap-4 transition-all duration-300 ease-in-out">
            {visibleCategories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => handleCategorySelect(cat)}
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl border border-pink-200 bg-white text-gray-900 font-medium hover:bg-pink-50 hover:border-pink-300 transition-all text-xs sm:text-sm md:text-base shadow-sm animate-fadeIn"
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Load More / Show Less Button */}
          {(hasMore || visibleCount > 8) && (
            <div className="mt-6 sm:mt-8 flex justify-center">
              {hasMore ? (
                <button
                  onClick={handleLoadMore}
                  className="flex items-center gap-2 text-primary font-semibold hover:text-[#8a3a7a] transition-colors bg-purple-50 px-4 sm:px-6 py-2 rounded-full border border-purple-100 hover:bg-purple-100 text-sm sm:text-base"
                >
                  Load More Categories
                  <ChevronDown className="w-4 h-4" />
                </button>
              ) : (
                 <button
                  onClick={handleShowLess}
                  className="flex items-center gap-2 text-gray-500 font-semibold hover:text-gray-700 transition-colors px-4 sm:px-6 py-2 rounded-full hover:bg-gray-100 text-sm sm:text-base"
                >
                  Show Less
                  <ChevronUp className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Custom Package Teaser/Button */}
        <div className="mt-12 sm:mt-16 bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-6 sm:p-8 border border-purple-100 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCategorySelect('Custom Package')}>
            <div className="relative z-10 text-center md:text-left">
                <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <span className="text-primary font-bold uppercase tracking-wider text-[10px] sm:text-xs">Premium Service</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Need a tailored solution?</h3>
                <p className="text-gray-700 max-w-md">Build a custom package that fits your specific health requirements and budget.</p>
            </div>
            <div className="relative z-10">
                <button className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-[#8a3a7a] transition-colors shadow-sm whitespace-nowrap">
                    Build Custom Package
                </button>
            </div>
            {/* Decoration */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2 group-hover:bg-purple-200 transition-colors"></div>
        </div>

      </div>
    </section>
  );
};

export default SearchAndCategories;
