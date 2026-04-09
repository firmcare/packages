'use client';

import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { Trash2, Check, Gift, Tag, AlertCircle, CreditCard, Calendar, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { getStoredReferralCode } from '@/components/ui/ReferralTracker';
import { useAnalytics } from '@/hooks/useAnalytics';
import { fmtNgn } from '@/lib/format';


declare global {
  interface Window {
    PaystackPop: {
      setup: (opts: {
        key: string;
        email: string;
        amount: number;
        ref: string;
        onClose: () => void;
        callback: (response: { reference: string }) => void;
      }) => { openIframe: () => void };
    };
  }
}

interface HomeCollectionLocation {
  id: string;
  name: string;
  price: number;
}

export default function CheckoutPage() {
  const {
    cart, removeFromCart, clearCart,
    voucherCode, setVoucherCode, appliedPromo, setAppliedPromo,
    referralCode, setReferralCode, appliedReferral, setAppliedReferral,
    selectedLocationId, setSelectedLocationId,
    selectedDate: savedDate, setSelectedDate: setSavedDate,
  } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const { track } = useAnalytics();

  const [showAllLocations, setShowAllLocations] = useState(false);
  const { data: locations = [], isLoading: locationsLoading } = useSWR<HomeCollectionLocation[]>(
    '/api/home-collection-locations',
  );
  const selectedLocation = locations.find((l) => l.id === selectedLocationId) ?? null;
  const homeCollectionAvailable = !locationsLoading && locations.length > 0;
  const LOCATIONS_COLLAPSE_THRESHOLD = 4;
  const visibleLocations = showAllLocations ? locations : locations.slice(0, LOCATIONS_COLLAPSE_THRESHOLD);

  // Appointment date
  const minDate = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })();
  const maxDate = (() => { const d = new Date(); d.setMonth(d.getMonth() + 3); return d.toISOString().split('T')[0]; })();
  // Use CartContext-backed date so it survives auth redirects; fall back to minDate if not set
  const selectedDate = savedDate || minDate;
  const setSelectedDate = (d: string) => { setSavedDate(d); };

  // Promo (persisted in CartContext)
  const [promoError, setPromoError] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // Referral (persisted in CartContext)
  const [referralError, setReferralError] = useState('');
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);

  // Payment
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const paystackScriptLoaded = useRef(false);

  // (no auto-select — user explicitly picks a location)

  // Auto-fill referral code from stored ?ref= param (set by ReferralTracker)
  useEffect(() => {
    const stored = getStoredReferralCode();
    if (stored && !referralCode) {
      setReferralCode(stored);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

const cartPrices = cart.map((item) => ({
    id: item.id,
    title: item.title,
    price: parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0,
  }));

  const basePrice = cartPrices.reduce((sum, i) => sum + i.price, 0);
  const homeCollectionFee = selectedLocation ? Number(selectedLocation.price) : 0;

  // Discount applies to package prices only — never to home collection fee
  const calculateDiscount = (): number => {
    if (!appliedPromo) return 0;
    const eligibleTotal = appliedPromo.applyToAll
      ? basePrice
      : cartPrices
          .filter((i) => appliedPromo.applicablePackageIds.includes(i.id))
          .reduce((s, i) => s + i.price, 0);
    if (appliedPromo.discountType === 'PERCENTAGE') {
      const raw = eligibleTotal * (appliedPromo.discountValue / 100);
      return appliedPromo.maxDiscount ? Math.min(raw, appliedPromo.maxDiscount) : raw;
    }
    return Math.min(appliedPromo.discountValue, eligibleTotal);
  };

  const discount = calculateDiscount();
  const total = Math.max(basePrice - discount + homeCollectionFee, 0);

  const fmt = fmtNgn;

  // --- Promo ---
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setPromoError('');
    setAppliedPromo(null);
    setIsValidatingPromo(true);
    try {
      const res = await fetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode.trim(), packageIds: cart.map((i) => i.id) }),
      });
      const data = await res.json();
      if (!data.valid) setPromoError(data.message || 'Invalid promo code.');
      else {
        setAppliedPromo(data.promo);
        track('promo_code_applied', { code: voucherCode.trim(), discount: data.promo?.discountValue });
      }
    } catch {
      setPromoError('Failed to validate. Please try again.');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // --- Referral ---
  const handleApplyReferral = async () => {
    if (!referralCode.trim()) return;
    setReferralError('');
    setAppliedReferral(null);
    setIsValidatingReferral(true);
    try {
      const res = await fetch('/api/referral/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: referralCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!data.valid) setReferralError(data.message || 'Invalid referral code.');
      else setAppliedReferral(data.referrer);
    } catch {
      setReferralError('Failed to validate referral code. Please try again.');
    } finally {
      setIsValidatingReferral(false);
    }
  };

  // --- Paystack Checkout ---
  const handleCheckout = async () => {
    if (!session?.user) {
      router.push('/auth/login?callbackUrl=/checkout');
      return;
    }

    if (!selectedDate) {
      setCheckoutError('Please select a preferred appointment date.');
      return;
    }

    setCheckoutError('');
    setIsProcessing(true);

    try {
      // Initialize Paystack transaction
      const initRes = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          cartItems: cart.map((i) => ({ id: i.id, title: i.title, price: String(i.price), includes: i.includes, customItems: i.customItems, selectedAddons: i.selectedAddons })),
          homeCollectionLocationId: selectedLocationId || null,
          bookingDate: new Date(selectedDate).toISOString(),
          promoCode: appliedPromo?.code ?? null,
          referralCode: appliedReferral ? referralCode.trim().toUpperCase() : null,
          discount,
        }),
      });

      if (initRes.status === 401) { router.push('/auth/login?callbackUrl=/checkout'); return; }
      if (!initRes.ok) {
        setCheckoutError('Could not initialize payment. Please try again.');
        setIsProcessing(false);
        return;
      }

      const { reference } = await initRes.json();

      // Open Paystack popup
      if (!window.PaystackPop) {
        setCheckoutError('Payment gateway not loaded. Please refresh and try again.');
        setIsProcessing(false);
        return;
      }

      const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
      if (!paystackKey) {
        setCheckoutError('Payment not configured. Please contact support.');
        setIsProcessing(false);
        return;
      }

      let handler: { openIframe: () => void } | null = null;
      try {
        handler = window.PaystackPop.setup({
          key: paystackKey,
          email: session.user.email!,
          amount: Math.round(total * 100), // kobo (must be integer)
          ref: reference,
          onClose: function () {
            setIsProcessing(false);
          },
          // Must be a plain function — Paystack rejects async functions
          callback: function (response: { reference: string }) {
            fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reference: response.reference }),
            })
              .then((r) => r.json())
              .then((verifyData) => {
                if (verifyData.success) {
                  track('checkout_completed', {
                    total,
                    item_count: cart.length,
                    booking_ids: verifyData.bookingIds ?? [],
                  });
                  clearCart();
                  setShowSuccess(true);
                } else {
                  setCheckoutError(verifyData.message || 'Payment verification failed.');
                  setIsProcessing(false);
                }
              })
              .catch((fetchErr) => {
                setCheckoutError('Verification error: ' + (fetchErr?.message || fetchErr) + ' | Ref: ' + response.reference);
                setIsProcessing(false);
              });
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('PaystackPop.setup error:', err);
        setCheckoutError(`Payment gateway error: ${msg}`);
        setIsProcessing(false);
        return;
      }

      if (!handler) {
        setCheckoutError('Payment gateway returned no handler. Check your Paystack public key.');
        setIsProcessing(false);
        return;
      }

      handler.openIframe();
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutError('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  // --- Render: Success ---
  if (showSuccess) {
    return (
      <div className="h-screen bg-linear-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Header band with inline checkmark */}
          <div className="bg-linear-to-r from-green-500 to-emerald-500 px-6 py-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="relative flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white stroke-3" />
                </div>
                <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Booking Confirmed!</h2>
            </div>
            <p className="text-green-100 text-xs">Your payment was processed successfully</p>
          </div>

          {/* Info rows */}
          <div className="px-5 py-4 space-y-3">

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-2xl border border-green-100">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Payment received</p>
                <p className="text-xs text-gray-500">Your booking has been secured and confirmed.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Confirmation email sent</p>
                <p className="text-xs text-gray-500">Check your inbox for booking details and next steps.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-2xl border border-purple-100">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Appointment scheduled</p>
                <p className="text-xs text-gray-500">Our team will reach out to confirm your appointment time.</p>
              </div>
            </div>

          </div>

          {/* CTA buttons */}
          <div className="px-5 pb-5 flex flex-col sm:flex-row gap-2">
            <Link
              href="/dashboard/bookings"
              className="flex-1 bg-primary text-white py-2.5 rounded-2xl font-bold text-sm text-center hover:bg-primary-dark transition-all shadow-md shadow-primary/20"
            >
              View My Bookings
            </Link>
            <Link
              href="/"
              className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 py-2.5 rounded-2xl font-bold text-sm text-center hover:bg-gray-100 transition-all"
            >
              Return Home
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400 pb-4">
            Questions? <span className="text-primary font-medium">support@firmcare.com</span>
          </p>
        </div>
      </div>
    );
  }

  // --- Render: Empty Cart ---
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
        <Link href="/packages" className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-dark transition-colors">
          Browse Packages
        </Link>
      </div>
    );
  }

  // --- Render: Checkout ---
  return (
    <>
    <Script
      src="https://js.paystack.co/v1/inline.js"
      strategy="lazyOnload"
      onLoad={() => { paystackScriptLoaded.current = true; }}
    />
    <div className="bg-gray-50 min-h-screen pb-20 animate-fadeIn">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-8">
          <Link href="/" className="text-primary hover:underline transition-colors">Home</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">Checkout</span>
        </div>

        <div className="space-y-4">

          {/* Order Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Order Summary
              <span className="ml-auto text-sm font-normal text-gray-400">{cart.length} item{cart.length > 1 ? 's' : ''}</span>
            </h2>

            <div className="space-y-3 mb-6">
              {cart.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="p-3 bg-gray-50 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.title}</p>
                      <p className="text-xs text-gray-400 truncate">{item.description.substring(0, 55)}…</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{item.price}</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-400 transition-colors" aria-label="Remove">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {item.selectedAddons && item.selectedAddons.length > 0 && (
                    <div className="pl-2 pt-1 border-t border-gray-200 space-y-1">
                      <p className="text-xs text-gray-400 font-medium">Add-ons:</p>
                      {item.selectedAddons.map((a) => (
                        <div key={a.id} className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-primary/60 inline-block" />
                            {a.name}
                          </span>
                          <span>+{fmtNgn(a.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Home Collection */}
            <div className="rounded-xl border border-dashed border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700">Home Sample Collection</p>
                  <p className="text-xs text-gray-400">
                    {locationsLoading
                      ? 'Checking availability…'
                      : !homeCollectionAvailable
                      ? 'Not available in your area at this time'
                      : selectedLocation
                      ? `${selectedLocation.name} · ${fmt(selectedLocation.price)} added`
                      : 'Select a service area below to add home collection'}
                  </p>
                </div>
                {selectedLocation && (
                  <span className="text-sm font-bold text-primary shrink-0">{fmt(selectedLocation.price)}</span>
                )}
              </div>

              {/* Location list */}
              {homeCollectionAvailable && (
                <div className="px-4 pb-4 border-t border-dashed border-gray-100 pt-3 space-y-2">
                  {visibleLocations.map((loc) => {
                    const checked = selectedLocationId === loc.id;
                    return (
                      <label
                        key={loc.id}
                        className={`flex items-center justify-between gap-4 p-3 rounded-xl border cursor-pointer transition-all ${
                          checked ? 'border-primary bg-purple-50' : 'border-gray-100 hover:border-primary/30 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative flex items-center shrink-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => setSelectedLocationId(checked ? '' : loc.id)}
                              className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 checked:border-primary checked:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                          </div>
                          <span className="text-sm font-medium text-gray-800 truncate">{loc.name}</span>
                        </div>
                        <span className="text-sm font-bold text-primary whitespace-nowrap shrink-0">{fmt(loc.price)}</span>
                      </label>
                    );
                  })}

                  {locations.length > LOCATIONS_COLLAPSE_THRESHOLD && (
                    <button
                      type="button"
                      onClick={() => setShowAllLocations((v) => !v)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                    >
                      {showAllLocations ? (
                        <><ChevronUp className="w-3.5 h-3.5" /> Show fewer</>
                      ) : (
                        <><ChevronDown className="w-3.5 h-3.5" /> Show {locations.length - LOCATIONS_COLLAPSE_THRESHOLD} more</>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Preferred Appointment Date */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Preferred Appointment Date
            </h3>
            <p className="text-xs text-gray-400 mb-3">Select your preferred date. Our team will confirm availability.</p>
            <input
              type="date"
              value={selectedDate}
              min={minDate}
              max={maxDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-gray-700"
            />
          </div>

          {/* Voucher Code */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" /> Promo / Voucher Code
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyVoucher()}
                placeholder="Enter promo code"
                disabled={!!appliedPromo}
                className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50"
              />
              {appliedPromo ? (
                <button onClick={() => { setAppliedPromo(null); setVoucherCode(''); }} className="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
                  Remove
                </button>
              ) : (
                <button onClick={handleApplyVoucher} disabled={isValidatingPromo || !voucherCode.trim()} className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40">
                  {isValidatingPromo ? '…' : 'Apply'}
                </button>
              )}
            </div>
            {appliedPromo && (() => {
              const eligibleIds = appliedPromo.applicablePackageIds;
              return (
                <div className="mt-3 rounded-xl border border-green-100 bg-green-50 p-3 space-y-2">
                  <p className="text-green-700 text-xs font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    &ldquo;{appliedPromo.code}&rdquo; applied —{' '}
                    {appliedPromo.discountType === 'PERCENTAGE'
                      ? `${appliedPromo.discountValue}% off eligible packages`
                      : `NGN ${Number(appliedPromo.discountValue).toLocaleString()} off`}
                  </p>
                  <div className="space-y-1">
                    {cartPrices.map((item) => {
                      const eligible = eligibleIds.includes(item.id);
                      const itemDiscount = eligible
                        ? appliedPromo.discountType === 'PERCENTAGE'
                          ? item.price * (appliedPromo.discountValue / 100)
                          : 0 // fixed shown as total below
                        : 0;
                      return (
                        <div key={item.id} className={`flex items-center justify-between text-xs gap-2 ${eligible ? 'text-gray-700' : 'text-gray-400'}`}>
                          <span className="flex items-center gap-1 truncate">
                            {eligible
                              ? <Check className="w-3 h-3 text-green-500 shrink-0" />
                              : <span className="w-3 h-3 shrink-0 inline-flex items-center justify-center text-gray-300">–</span>}
                            <span className="truncate">{item.title}</span>
                          </span>
                          <span className="whitespace-nowrap font-medium shrink-0">
                            {eligible && appliedPromo.discountType === 'PERCENTAGE'
                              ? <span className="text-green-600">−NGN {itemDiscount.toLocaleString()}</span>
                              : eligible
                              ? <span className="text-green-600">eligible</span>
                              : 'not eligible'}
                          </span>
                        </div>
                      );
                    })}
                    {appliedPromo.discountType === 'FIXED' && (
                      <p className="text-xs text-green-700 pt-1 border-t border-green-100">
                        NGN {Number(appliedPromo.discountValue).toLocaleString()} off applied to eligible packages · Home collection fee excluded
                      </p>
                    )}
                    {appliedPromo.discountType === 'PERCENTAGE' && !!selectedLocation && (
                      <p className="text-xs text-gray-400 pt-1 border-t border-green-100">
                        Home collection fee is excluded from discount
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}
            {promoError && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{promoError}</p>}
          </div>

          {/* Referral Code */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" /> Referral Code
            </h3>
            <p className="text-xs text-gray-400 mb-3">Have a referral code? Enter it here — the referrer earns a reward when you pay.</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyReferral()}
                placeholder="e.g. ADE7K2"
                disabled={!!appliedReferral}
                className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 font-mono tracking-widest"
              />
              {appliedReferral ? (
                <button onClick={() => { setAppliedReferral(null); setReferralCode(''); }} className="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
                  Remove
                </button>
              ) : (
                <button onClick={handleApplyReferral} disabled={isValidatingReferral || !referralCode.trim()} className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40">
                  {isValidatingReferral ? '…' : 'Apply'}
                </button>
              )}
            </div>
            {appliedReferral && (
              <p className="text-green-600 text-xs mt-2 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Referral applied — {appliedReferral.name} will earn a reward on your package price when you complete payment.
              </p>
            )}
            {referralError && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{referralError}</p>}
          </div>

          {/* Price Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Packages ({cart.length})</span>
                <span>{fmt(basePrice)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Voucher discount ({appliedPromo?.code})</span>
                  <span>− {fmt(discount)}</span>
                </div>
              )}
              {appliedReferral && (
                <div className="flex justify-between text-sm text-purple-600">
                  <span className="flex items-center gap-1">
                    <Gift className="w-3 h-3" /> Referral code
                  </span>
                  <span className="font-mono font-semibold tracking-widest">{referralCode}</span>
                </div>
              )}
              {selectedLocation && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    Home Collection — {selectedLocation.name}{' '}
                    <span className="text-gray-400 font-normal">(not discounted)</span>
                  </span>
                  <span>{fmt(selectedLocation.price)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span className="text-base font-extrabold text-gray-900">Total</span>
                <span className="text-xl font-extrabold text-primary">{fmt(total)}</span>
              </div>
            </div>
          </div>

          {checkoutError && (
            <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {checkoutError}
            </div>
          )}

          {/* Pay Button */}
          <button
            onClick={handleCheckout}
            disabled={isProcessing || cart.length === 0}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-primary-dark transition-all duration-200 shadow-lg shadow-primary/30 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            {isProcessing ? 'Opening Payment…' : `Pay ${fmt(total)} with Paystack`}
          </button>

          <p className="text-center text-xs text-gray-400 pb-4">
            Secured by Paystack · Your card details are never stored by us.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
