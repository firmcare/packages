
'use client';

import React, { useState, useMemo } from 'react';
import { Package } from '@/lib/types';
import { Minus, Plus, Layers, FileText, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';

// Mock Data Structure
const SERVICE_CATEGORIES = [
  {
    name: "Haematology",
    items: [
      { id: 'h1', name: 'Full Blood Count', price: 2500 },
      { id: 'h2', name: 'Pack Cell Volume (PCV)', price: 1500 },
      { id: 'h3', name: 'Genotype', price: 3000 },
      { id: 'h4', name: 'Blood Group', price: 1500 },
      { id: 'h5', name: 'Haemoglobin', price: 1500 },
    ]
  },
  {
    name: "Chemistry",
    items: [
      { id: 'c1', name: 'Fasting Blood Sugar', price: 2000 },
      { id: 'c2', name: 'Liver Function Test', price: 8000 },
      { id: 'c3', name: 'Kidney Function Test', price: 8000 },
      { id: 'c4', name: 'Lipid Profile', price: 6000 },
      { id: 'c5', name: 'Uric Acid', price: 3000 },
    ]
  },
  {
    name: "Hormonal Profile",
    items: [
      { id: 'hp1', name: 'Thyroid Function Test', price: 15000 },
      { id: 'hp2', name: 'Prolactin', price: 9000 },
      { id: 'hp3', name: 'Testosterone', price: 9000 },
      { id: 'hp4', name: 'Estrogen', price: 9000 },
    ]
  },
  {
    name: "Radiology",
    items: [
      { id: 'r1', name: 'Chest X-Ray', price: 5000 },
      { id: 'r2', name: 'Abdominal Scan', price: 7000 },
      { id: 'r3', name: 'Pelvic Scan', price: 7000 },
      { id: 'r4', name: 'Obstetric Scan', price: 5000 },
    ]
  },
  {
    name: "Microbiology",
    items: [
      { id: 'm1', name: 'Urinalysis', price: 2000 },
      { id: 'm2', name: 'Stool Analysis', price: 2000 },
      { id: 'm3', name: 'Sputum Test', price: 3000 },
      { id: 'm4', name: 'HVS MCS', price: 4000 },
    ]
  }
];

const CustomPackageBuilderPage: React.FC = () => {
  const router = useRouter();
  const { addToCart } = useCart();
  const toast = useToast();
  
  // State for expanded accordion sections
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "Haematology": true
  });

  // State for selected items
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [discountCode, setDiscountCode] = useState('');
  const [isVoucherApplied, setIsVoucherApplied] = useState(false);

  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  // Toggle item selection
  const toggleItem = (itemId: string) => {
    setSelectedItemIds(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  // Calculate Derived Data
  const selectedItemsData = useMemo(() => {
    const allItems = SERVICE_CATEGORIES.flatMap(c => c.items);
    return allItems.filter(item => selectedItemIds.includes(item.id));
  }, [selectedItemIds]);

  const subtotal = selectedItemsData.reduce((sum, item) => sum + item.price, 0);
  const discount = isVoucherApplied ? subtotal * 0.10 : 0; 
  const total = subtotal - discount;

  const formatCurrency = (amount: number) => `NGN${amount.toLocaleString()}`;

  const handleApplyVoucher = () => {
      if (discountCode.trim()) {
          setIsVoucherApplied(true);
      }
  };

  const handleBookPackage = () => {
    if (selectedItemsData.length === 0) {
        toast.warning("Please select at least one service.");
        return;
    }

    const customPackage: Package = {
        id: `custom-${Date.now()}`,
        slug: 'custom-tailored-package',
        title: "Custom Tailored Package",
        description: "A personalized selection of diagnostic services.",
        price: formatCurrency(total),
        imageUrl: "https://images.unsplash.com/photo-1584515933487-9bdb75f77f1e?auto=format&fit=crop&q=80&w=800",
        includes: selectedItemsData.map(item => item.name),
        customItems: selectedItemsData.map(item => ({ name: item.name, price: item.price })),
    };

    addToCart(customPackage);
    router.push('/checkout');
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 animate-fadeIn font-sans">
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-8">
          <Link href="/" className="text-[#9d4496] hover:underline">Home</Link>
          <span className="text-gray-400">&gt;</span>
          <span className="text-[#9d4496]">Custom Package</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Custom Package</h1>
          <p className="text-[#9d4496] font-medium">Build a tailored package that fits your specific needs</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Services Selection */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <Layers className="w-5 h-5 text-gray-500" />
                <h3 className="font-bold text-gray-900">Select Services</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-6">Choose from our available services to include in your package</p>
                
                <div className="space-y-4">
                  {SERVICE_CATEGORIES.map((category, idx) => {
                    const isExpanded = !!expandedCategories[category.name];
                    return (
                      <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden">
                        <button 
                          onClick={() => toggleCategory(category.name)}
                          className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-semibold text-gray-800 text-lg">{category.name}</span>
                          {isExpanded ? (
                            <Minus className="w-5 h-5 text-gray-400" />
                          ) : (
                            <Plus className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        
                        {isExpanded && (
                          <div className="p-4 bg-white animate-fadeIn">
                            {category.items.map((item) => {
                              const isSelected = selectedItemIds.includes(item.id);
                              return (
                                <div 
                                  key={item.id} 
                                  onClick={() => toggleItem(item.id)}
                                  className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 cursor-pointer group hover:bg-purple-50/30 px-2 rounded-lg transition-colors"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#9d4496] border-[#9d4496]' : 'border-gray-300 bg-white'}`}>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{item.name}</span>
                                  </div>
                                  <span className="text-sm text-gray-500 font-medium">{formatCurrency(item.price)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Summary */}
          <div className="w-full lg:w-1/3">
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <h3 className="font-bold text-gray-900">Package Summary</h3>
                </div>
                
                <div className="p-6">
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wider">Services Included</h4>
                    {selectedItemsData.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {selectedItemsData.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                             <span className="text-gray-600 truncate max-w-[180px]">{item.name}</span>
                             <span className="text-gray-900 font-medium">{formatCurrency(item.price)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No services selected yet</p>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className="text-xs font-bold text-gray-800 mb-2 block uppercase tracking-wider">Voucher Code</label>
                    <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={discountCode}
                          onChange={(e) => {
                              setDiscountCode(e.target.value);
                              setIsVoucherApplied(false);
                          }}
                          placeholder="Enter voucher code"
                          className="flex-grow bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#9d4496] transition-colors"
                        />
                        <button 
                            onClick={handleApplyVoucher}
                            className="bg-[#9d4496] text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-800 transition-colors shadow-sm text-sm"
                        >
                            Apply
                        </button>
                    </div>
                    {isVoucherApplied && (
                        <p className="text-green-600 text-xs mt-2 font-medium">Voucher applied successfully! 10% off.</p>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-3 mb-8">
                    <div className="flex justify-between items-center text-sm font-medium text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {isVoucherApplied && (
                        <div className="flex justify-between items-center text-sm font-medium text-green-600">
                          <span>Discount</span>
                          <span>-{formatCurrency(discount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleBookPackage}
                    className="w-full bg-[#9d4496] text-white py-3.5 rounded-full font-bold hover:bg-purple-800 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={selectedItemsData.length === 0}
                  >
                    Book Custom Package
                  </button>

                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CustomPackageBuilderPage;
