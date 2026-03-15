'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Check, Gift, Tag, AlertCircle, CreditCard, Calendar } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PromoResult {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minAmount: number | null;
  maxDiscount: number | null;
}

interface ReferrerInfo {
  id: string;
  name: string;
}

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

const HOME_COLLECTION_FEE = 15000;

export default function CheckoutPage() {
  const { cart, removeFromCart, clearCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [includeHomeCollection, setIncludeHomeCollection] = useState(false);

  // Appointment date
  const minDate = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })();
  const maxDate = (() => { const d = new Date(); d.setMonth(d.getMonth() + 3); return d.toISOString().split('T')[0]; })();
  const [selectedDate, setSelectedDate] = useState(minDate);

  // Promo
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoResult | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // Referral
  const [referralCode, setReferralCode] = useState('');
  const [appliedReferral, setAppliedReferral] = useState<ReferrerInfo | null>(null);
  const [referralError, setReferralError] = useState('');
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);

  // Payment
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const paystackScriptLoaded = useRef(false);

  // Load Paystack inline script once
  useEffect(() => {
    if (paystackScriptLoaded.current) return;
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    paystackScriptLoaded.current = true;
  }, []);

  // Reset promo/referral when cart changes
  useEffect(() => {
    setAppliedPromo(null);
    setPromoError('');
    setVoucherCode('');
  }, [cart.length]);

  const basePrice = cart.reduce((sum, item) => {
    return sum + (parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0);
  }, 0);

  const subtotal = basePrice + (includeHomeCollection ? HOME_COLLECTION_FEE : 0);

  const calculateDiscount = (): number => {
    if (!appliedPromo) return 0;
    if (appliedPromo.discountType === 'PERCENTAGE') {
      const raw = subtotal * (appliedPromo.discountValue / 100);
      return appliedPromo.maxDiscount ? Math.min(raw, appliedPromo.maxDiscount) : raw;
    }
    return Math.min(appliedPromo.discountValue, subtotal);
  };

  const discount = calculateDiscount();
  const total = Math.max(subtotal - discount, 0);

  const fmt = (n: number) => `NGN ${n.toLocaleString()}`;

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
        body: JSON.stringify({ code: voucherCode.trim(), packageId: cart[0]?.id ?? '' }),
      });
      const data = await res.json();
      if (!data.valid) setPromoError(data.message || 'Invalid promo code.');
      else setAppliedPromo(data.promo);
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
      if (res.status === 401) { router.push('/auth/login?callbackUrl=/checkout'); return; }
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
          cartItems: cart.map((i) => ({ id: i.id, title: i.title, price: String(i.price), includes: i.includes, customItems: i.customItems })),
          homeCollection: includeHomeCollection,
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
        <Link href="/category/all" className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-dark transition-colors">
          Browse Packages
        </Link>
      </div>
    );
  }

  // --- Render: Checkout ---
  return (
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
                <div key={`${item.id}-${idx}`} className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-xl">
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
              ))}
            </div>

            {/* Home Collection */}
            <label className="flex items-center justify-between p-4 rounded-xl border border-dashed border-gray-200 cursor-pointer hover:border-primary/40 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={includeHomeCollection}
                    onChange={(e) => setIncludeHomeCollection(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 checked:border-primary checked:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Home Sample Collection</p>
                  <p className="text-xs text-gray-400">A phlebotomist visits you at home</p>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-600">{fmt(HOME_COLLECTION_FEE)}</span>
            </label>
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
            {appliedPromo && (
              <p className="text-green-600 text-xs mt-2 flex items-center gap-1">
                <Check className="w-3 h-3" />
                &ldquo;{appliedPromo.code}&rdquo; applied —{' '}
                {appliedPromo.discountType === 'PERCENTAGE' ? `${appliedPromo.discountValue}% off` : `NGN ${Number(appliedPromo.discountValue).toLocaleString()} off`}
              </p>
            )}
            {promoError && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{promoError}</p>}
          </div>

          {/* Referral Code */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" /> Referral Code
            </h3>
            <p className="text-xs text-gray-400 mb-3">Enter a friend&apos;s referral code. They&apos;ll earn a reward when you pay.</p>
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
                Referral applied — {appliedReferral.name} will earn 5% when you complete payment.
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
              {includeHomeCollection && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Home Collection</span>
                  <span>{fmt(HOME_COLLECTION_FEE)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({appliedPromo?.code})</span>
                  <span>− {fmt(discount)}</span>
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
  );
}
