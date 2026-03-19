'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, User } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const NAV_LINKS = [
  { label: 'Packages', href: '/category/all' },
  { label: 'Custom Package', href: '/custom-package' },
  { label: 'Become a Partner', href: '/#become-agent' },
];

const Header: React.FC = () => {
  const { cartCount } = useCart();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isActive = (href: string) => {
    if (href.includes('#')) return false;
    if (href === '/custom-package') return pathname === '/custom-package';
    // "Packages" is active on /category/*, /package/*, but NOT /custom-package
    return (pathname.startsWith('/category') || pathname.startsWith('/package')) && pathname !== '/custom-package';
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => setIsMobileMenuOpen(false);

  const portalHref = session?.user
    ? (session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN'
        ? '/admin'
        : session.user.role === 'AGENT'
        ? '/agent/dashboard'
        : '/dashboard')
    : '/auth/login';

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md' : 'bg-white/90 backdrop-blur-sm shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-3 md:py-4 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" onClick={close} className="shrink-0">
          <Image
            src="/logo.png"
            alt="FirmCare Logo"
            width={140}
            height={56}
            className="object-contain h-10 w-auto"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors relative group ${
                  active ? 'text-primary' : 'text-gray-600 hover:text-primary'
                }`}
              >
                {link.label}
                <span className={`absolute -bottom-0.5 left-0 h-0.5 bg-primary rounded-full transition-all duration-300 ${
                  active ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </Link>
            );
          })}
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/checkout"
            className="relative p-2.5 text-gray-600 hover:text-primary hover:bg-purple-50 rounded-full transition-colors"
            aria-label="View cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-fadeIn">
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            href={portalHref}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm hover:shadow-md"
          >
            <User className="w-4 h-4" />
            {session?.user ? 'My Portal' : 'Patient Portal'}
          </Link>
        </div>

        {/* Mobile Right Actions */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/checkout"
            onClick={close}
            className="relative p-2 text-gray-600 hover:text-primary rounded-full"
            aria-label="View cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-slideInUp">
          <nav className="px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className={`block px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    active
                      ? 'text-primary bg-purple-50 font-semibold'
                      : 'text-gray-700 hover:text-primary hover:bg-purple-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-2">
              <Link
                href={portalHref}
                onClick={close}
                className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                <User className="w-4 h-4" />
                {session?.user ? 'My Portal' : 'Patient Portal'}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
