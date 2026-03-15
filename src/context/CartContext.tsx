
'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Package } from '@/lib/types';

interface CartContextType {
  cart: Package[];
  addToCart: (pkg: Package) => void;
  removeFromCart: (pkgId: string) => void;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Package[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
     const saved = localStorage.getItem('firmcare-cart');
     if (saved) {
         try {
             setCart(JSON.parse(saved));
         } catch (e) {
             console.error("Failed to parse cart", e);
         }
     }
     setIsInitialized(true);
  }, []);

  useEffect(() => {
      if (isInitialized) {
        localStorage.setItem('firmcare-cart', JSON.stringify(cart));
      }
  }, [cart, isInitialized]);

  const addToCart = (pkg: Package) => {
    setCart(prev => [...prev, pkg]);
    // Optional: Toast here
  };

  const removeFromCart = (pkgId: string) => {
      setCart(prev => prev.filter(p => p.id !== pkgId)); // simplistic removal by id, might remove duplicates if same id added twice. logic dependent on use case.
  };
  
  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartCount: cart.length }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within CartProvider");
    return context;
};
