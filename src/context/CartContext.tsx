'use client';
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Package } from '@/lib/types';
import { useSession } from 'next-auth/react';

export interface PromoResult {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minAmount: number | null;
  maxDiscount: number | null;
  applyToAll: boolean;
  applicablePackageIds: string[];
}

export interface ReferrerInfo {
  id: string;
  name: string;
}

interface Extras {
  voucherCode?: string;
  appliedPromo?: PromoResult | null;
  referralCode?: string;
  appliedReferral?: ReferrerInfo | null;
  selectedLocationId?: string;
  selectedDate?: string;
}

interface CartContextType {
  cart: Package[];
  addToCart: (pkg: Package) => void;
  removeFromCart: (pkgId: string) => void;
  clearCart: () => void;
  cartCount: number;
  voucherCode: string;
  setVoucherCode: (code: string) => void;
  appliedPromo: PromoResult | null;
  setAppliedPromo: (promo: PromoResult | null) => void;
  referralCode: string;
  setReferralCode: (code: string) => void;
  appliedReferral: ReferrerInfo | null;
  setAppliedReferral: (referrer: ReferrerInfo | null) => void;
  selectedLocationId: string;
  setSelectedLocationId: (id: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY   = 'firmcare-cart';
const EXTRAS_KEY = 'firmcare-cart-extras';

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated' && !!session?.user?.id;

  const [cart,              setCart]              = useState<Package[]>([]);
  const [voucherCode,       setVoucherCode]       = useState('');
  const [appliedPromo,      setAppliedPromo]      = useState<PromoResult | null>(null);
  const [referralCode,      setReferralCode]      = useState('');
  const [appliedReferral,   setAppliedReferral]   = useState<ReferrerInfo | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedDate,      setSelectedDate]      = useState('');
  const [ready, setReady] = useState(false);

  // Track whether the initial load has run so we don't over-sync
  const initialLoadDone = useRef(false);

  // ── Load cart ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'loading') return; // wait for session to resolve

    if (isLoggedIn) {
      // Load from server; merge any local guest cart items not already present
      fetch('/api/cart')
        .then((r) => r.ok ? r.json() : { items: [], extras: {} })
        .then(({ items: serverItems, extras: serverExtras }: { items: Package[]; extras: Extras }) => {
          const localItems: Package[] = readLocal(CART_KEY, []);
          // Merge: server items first, then any local items not already in server cart
          const serverIds = new Set((serverItems as Package[]).map((p) => p.id));
          const merged = [...serverItems, ...localItems.filter((p) => !serverIds.has(p.id))];

          setCart(merged);
          // Server extras take precedence; fall back to local
          const localExtras: Extras = readLocal(EXTRAS_KEY, {});
          const extras = Object.keys(serverExtras).length ? serverExtras : localExtras;
          setVoucherCode(extras.voucherCode ?? '');
          setAppliedPromo(extras.appliedPromo ?? null);
          setReferralCode(extras.referralCode ?? '');
          setAppliedReferral(extras.appliedReferral ?? null);
          setSelectedLocationId(extras.selectedLocationId ?? '');
          setSelectedDate(extras.selectedDate ?? '');

          // Clear localStorage now that server is authoritative
          localStorage.removeItem(CART_KEY);
          localStorage.removeItem(EXTRAS_KEY);
          setReady(true);
          initialLoadDone.current = true;
        })
        .catch(() => {
          // Server unreachable — fall back to localStorage
          setCart(readLocal(CART_KEY, []));
          const e: Extras = readLocal(EXTRAS_KEY, {});
          setVoucherCode(e.voucherCode ?? '');
          setAppliedPromo(e.appliedPromo ?? null);
          setReferralCode(e.referralCode ?? '');
          setAppliedReferral(e.appliedReferral ?? null);
          setSelectedLocationId(e.selectedLocationId ?? '');
          setSelectedDate(e.selectedDate ?? '');
          setReady(true);
          initialLoadDone.current = true;
        });
    } else {
      // Guest — use localStorage
      setCart(readLocal(CART_KEY, []));
      const e: Extras = readLocal(EXTRAS_KEY, {});
      setVoucherCode(e.voucherCode ?? '');
      setAppliedPromo(e.appliedPromo ?? null);
      setReferralCode(e.referralCode ?? '');
      setAppliedReferral(e.appliedReferral ?? null);
      setSelectedLocationId(e.selectedLocationId ?? '');
      setSelectedDate(e.selectedDate ?? '');
      setReady(true);
      initialLoadDone.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isLoggedIn]);

  // ── Sync helper — debounced server save ──────────────────────────────────
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncToServer = useCallback((items: Package[], extras: Extras) => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, extras }),
      }).catch(() => {});
    }, 600);
  }, []);

  // ── Persist on every change ──────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !initialLoadDone.current) return;
    const extras: Extras = { voucherCode, appliedPromo, referralCode, appliedReferral, selectedLocationId, selectedDate };
    if (isLoggedIn) {
      syncToServer(cart, extras);
    } else {
      try { localStorage.setItem(CART_KEY,   JSON.stringify(cart));   } catch {}
      try { localStorage.setItem(EXTRAS_KEY, JSON.stringify(extras)); } catch {}
    }
  }, [cart, voucherCode, appliedPromo, referralCode, appliedReferral, selectedLocationId, selectedDate, isLoggedIn, ready, syncToServer]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const addToCart = (pkg: Package) => setCart((prev) => [...prev, pkg]);

  const removeFromCart = (pkgId: string) => {
    setCart((prev) => prev.filter((p) => p.id !== pkgId));
    // Invalidate promo — it may no longer be applicable
    setAppliedPromo(null);
    setVoucherCode('');
  };

  const clearCart = () => {
    setCart([]);
    setVoucherCode(''); setAppliedPromo(null);
    setReferralCode(''); setAppliedReferral(null);
    setSelectedLocationId(''); setSelectedDate('');
    if (isLoggedIn) {
      fetch('/api/cart', { method: 'DELETE' }).catch(() => {});
    } else {
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(EXTRAS_KEY);
    }
  };

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, clearCart, cartCount: cart.length,
      voucherCode, setVoucherCode, appliedPromo, setAppliedPromo,
      referralCode, setReferralCode, appliedReferral, setAppliedReferral,
      selectedLocationId, setSelectedLocationId,
      selectedDate, setSelectedDate,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
