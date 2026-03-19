"use client";

import React, { useState, useMemo } from "react";
import { Package } from "@/lib/types";
import { Search, X, Check, Layers, FileText, Tag, AlertCircle, CheckCircle2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";

interface TestItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface AppliedPromo {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minAmount: number | null;
  maxDiscount: number | null;
}

interface Props {
  dbTests: TestItem[];
}

function calcDiscount(promo: AppliedPromo, subtotal: number): number {
  if (promo.minAmount && subtotal < promo.minAmount) return 0;
  let discount =
    promo.discountType === "PERCENTAGE"
      ? (subtotal * Number(promo.discountValue)) / 100
      : Number(promo.discountValue);
  if (promo.maxDiscount) discount = Math.min(discount, Number(promo.maxDiscount));
  return discount;
}

export default function CustomPackageBuilder({ dbTests }: Props) {
  const router = useRouter();
  const { addToCart } = useCart();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<"idle" | "loading" | "valid" | "invalid">("idle");
  const [promoMessage, setPromoMessage] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);

  const [referralCode, setReferralCode] = useState("");
  const [referralStatus, setReferralStatus] = useState<"idle" | "loading" | "valid" | "invalid">("idle");
  const [referralMessage, setReferralMessage] = useState("");
  const [appliedReferral, setAppliedReferral] = useState(false);

  // Filtered tests for display
  const visibleTests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dbTests;
    return dbTests.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }, [search, dbTests]);

  const selectedTests = useMemo(
    () => dbTests.filter((t) => selectedIds.has(t.id)),
    [dbTests, selectedIds]
  );

  const subtotal = selectedTests.reduce((s, t) => s + t.price, 0);
  const discount = appliedPromo ? calcDiscount(appliedPromo, subtotal) : 0;
  const total = Math.max(0, subtotal - discount);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    // Invalidate promo if total changes
    if (appliedPromo) {
      setAppliedPromo(null);
      setPromoStatus("idle");
      setPromoMessage("");
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    if (subtotal === 0) {
      setPromoStatus("invalid");
      setPromoMessage("Select at least one test before applying a promo.");
      return;
    }
    setPromoStatus("loading");
    setPromoMessage("");
    try {
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), isCustomPackage: true }),
      });
      const data = await res.json();
      if (data.valid) {
        const p = data.promo as AppliedPromo;
        const d = calcDiscount(p, subtotal);
        if (d === 0 && p.minAmount && subtotal < p.minAmount) {
          setPromoStatus("invalid");
          setPromoMessage(`Minimum order of ${fmt(p.minAmount)} required for this promo.`);
        } else {
          setAppliedPromo(p);
          setPromoStatus("valid");
          setPromoMessage(`${p.discountType === "PERCENTAGE" ? `${p.discountValue}%` : fmt(p.discountValue)} discount applied!`);
        }
      } else {
        setPromoStatus("invalid");
        setPromoMessage(data.message ?? "Invalid promo code.");
      }
    } catch {
      setPromoStatus("invalid");
      setPromoMessage("Could not validate promo code. Try again.");
    }
  };

  const handleApplyReferral = async () => {
    if (!referralCode.trim()) return;
    setReferralStatus("loading");
    setReferralMessage("");
    try {
      const res = await fetch("/api/referral/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: referralCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedReferral(true);
        setReferralStatus("valid");
        setReferralMessage(`Referral applied! ${data.referrerName ?? ""} will earn a reward.`.trim());
      } else {
        setReferralStatus("invalid");
        setReferralMessage(data.message ?? "Invalid referral code.");
      }
    } catch {
      setReferralStatus("invalid");
      setReferralMessage("Could not validate referral code. Try again.");
    }
  };

  const handleRemoveReferral = () => {
    setAppliedReferral(false);
    setReferralCode("");
    setReferralStatus("idle");
    setReferralMessage("");
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoStatus("idle");
    setPromoMessage("");
  };

  const handleBook = () => {
    if (selectedTests.length === 0) {
      toast.warning("Please select at least one test.");
      return;
    }

    const pkg: Package = {
      id: `custom-${Date.now()}`,
      slug: "custom-tailored-package",
      title: "Custom Tailored Package",
      description: "A personalised selection of diagnostic tests.",
      price: `NGN${total}`,
      imageUrl: "https://images.unsplash.com/photo-1584515933487-9bdb75f77f1e?auto=format&fit=crop&q=80&w=800",
      includes: selectedTests.map((t) => t.name),
      customItems: selectedTests.map((t) => ({ name: t.name, price: t.price })),
    };

    addToCart(pkg);
    if (appliedReferral && referralCode.trim()) {
      sessionStorage.setItem("referral_code", referralCode.trim().toUpperCase());
    }
    router.push("/checkout");
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-8 text-gray-500">
          <Link href="/" className="text-primary hover:underline">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Custom Package</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Build Your Custom Package</h1>
          <p className="text-gray-500">Select individual tests and only pay for what you need.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left: test selector */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                <Layers className="w-5 h-5 text-gray-400" />
                <h3 className="font-bold text-gray-900">Available Tests</h3>
                <span className="ml-auto text-xs text-gray-400">{dbTests.length} tests</span>
              </div>

              {/* Search */}
              <div className="px-5 pt-4 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tests…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Test list */}
              <div className="px-5 pb-5 max-h-[520px] overflow-y-auto space-y-1">
                {visibleTests.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">No tests match your search.</p>
                ) : (
                  visibleTests.map((test) => {
                    const selected = selectedIds.has(test.id);
                    return (
                      <div
                        key={test.id}
                        onClick={() => toggle(test.id)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors select-none ${
                          selected
                            ? "bg-purple-50 border border-primary/20"
                            : "hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                              selected
                                ? "bg-primary border-primary"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {selected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-medium truncate ${selected ? "text-gray-900" : "text-gray-700"}`}>
                              {test.name}
                            </p>
                            {test.description && (
                              <p className="text-xs text-gray-400 truncate">{test.description}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 shrink-0 ml-4">
                          {fmt(test.price)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right: summary */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
              <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <h3 className="font-bold text-gray-900">Package Summary</h3>
              </div>

              <div className="p-5 space-y-5">
                {/* Selected tests */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Selected Tests ({selectedTests.length})
                  </p>
                  {selectedTests.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No tests selected yet</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {selectedTests.map((t) => (
                        <div key={t.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-gray-700 truncate flex-1">{t.name}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-gray-900 font-medium">{fmt(t.price)}</span>
                            <button
                              onClick={() => toggle(t.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                              aria-label={`Remove ${t.name}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Promo code */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Promo Code
                  </p>
                  {appliedPromo ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-2 text-sm text-green-700 font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        {appliedPromo.code}
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        className="text-green-400 hover:text-green-700 transition-colors"
                        aria-label="Remove promo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => { setPromoCode(e.target.value); setPromoStatus("idle"); }}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                        placeholder="Enter code"
                        className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50"
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={promoStatus === "loading" || !promoCode.trim()}
                        className="px-3 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors"
                      >
                        {promoStatus === "loading" ? "…" : "Apply"}
                      </button>
                    </div>
                  )}
                  {promoMessage && promoStatus !== "idle" && (
                    <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${promoStatus === "valid" ? "text-green-600" : "text-red-500"}`}>
                      {promoStatus === "invalid" && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                      {promoStatus === "valid" && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      {promoMessage}
                    </div>
                  )}
                </div>

                {/* Referral code */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Referral Code
                  </p>
                  <p className="text-xs text-gray-400 mb-2">Have a referral code? Enter it here — the referrer earns a reward when you pay.</p>
                  {appliedReferral ? (
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-2 text-sm text-blue-700 font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        {referralCode.toUpperCase()}
                      </div>
                      <button
                        onClick={handleRemoveReferral}
                        className="text-blue-400 hover:text-blue-700 transition-colors"
                        aria-label="Remove referral"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={referralCode}
                        onChange={(e) => { setReferralCode(e.target.value.toUpperCase()); setReferralStatus("idle"); }}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyReferral()}
                        placeholder="Enter code"
                        className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50 uppercase"
                      />
                      <button
                        onClick={handleApplyReferral}
                        disabled={referralStatus === "loading" || !referralCode.trim()}
                        className="px-3 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors"
                      >
                        {referralStatus === "loading" ? "…" : "Apply"}
                      </button>
                    </div>
                  )}
                  {referralMessage && referralStatus !== "idle" && (
                    <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${referralStatus === "valid" ? "text-blue-600" : "text-red-500"}`}>
                      {referralStatus === "invalid" && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                      {referralStatus === "valid" && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      {referralMessage}
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">{fmt(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-semibold">
                      <span>Promo ({appliedPromo!.code})</span>
                      <span>-{fmt(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-1 border-t border-gray-100 mt-1">
                    <span>Total</span>
                    <span>{fmt(total)}</span>
                  </div>
                </div>

                <button
                  onClick={handleBook}
                  disabled={selectedTests.length === 0}
                  className="w-full bg-primary text-white py-3.5 rounded-full font-bold text-sm hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  {selectedTests.length === 0
                    ? "Select tests to continue"
                    : `Book ${selectedTests.length} Test${selectedTests.length > 1 ? "s" : ""} — ${fmt(total)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
