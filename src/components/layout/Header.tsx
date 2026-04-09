'use client';

import React, { useState } from 'react';
import { ShoppingCart, Menu, X, User, Clock, Phone, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  {
    label: 'About us',
    href: null,
    hasDropdown: true,
    children: [
      { label: 'Our Story', href: '/about-us' },
      { label: 'Our Services', href: '/our-services' },
      { label: 'Our Management Team', href: '/our-team' },
    ],
  },
  {
    label: 'Individuals',
    href: null,
    hasDropdown: true,
    children: [
      { label: 'View Healthcare Packages', href: '/packages' },
      { label: 'Request home collection', href: '/packages' },
    ],
  },
    {
    label: 'For Companies & Organisations',
    href: null,
    hasDropdown: true,
    children: [
      {
        label: 'Employers',
        href: null,
        children: [
          { label: 'Pre-employment screening', href: '/company/pre-employment-screening' },
          { label: 'Domestic staff Screening', href: '/company/domestic-staff-screening' },
          { label: 'Staff Health & Wellness Management', href: '/company/staff-health-wellness-management' },
          { label: 'School Staff Wellness Programme', href: '/company/school-staff-wellness-programme' },
          { label: 'Food handlers Test', href: '/company/food-handlers-test' },
        ],
      }, 
      { label: 'HMO Enrollee Screening', href: '/company/#hmo' }, 
      { label: 'Medical Research & Project Support', href: '/company/#medicalresearch' }, 
      { label: 'Medical Check for Life Scheme', href: '/company/#lifeinsurance' }, 
    ],
  },
    {
    label: 'For Physicians & Hospitals',
    href: null,
    hasDropdown: true,
    children: [
      { label: 'View Packages', href: '/packages' },
      { label: 'Explore Full Test Menu', href: '/packages' },
      { label: 'Request Sample Pick-Up', href: '/packages' },
      { label: 'Firmcare Advantage', href: '/physicians/firmcare-advantage' },
    ],
  },
  { label: 'Contact us', href: '/contact-us' },
  { label: 'Blog', href: '/blog' },
  { label: 'Become an Agent', href: '/become-an-agent' },
];

const Header: React.FC = () => {
  const { cartCount } = useCart();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobile, setOpenMobile] = useState<string | null>(null);
  const [openMobileSub, setOpenMobileSub] = useState<string | null>(null);

  const isActive = (href: string) => {
    if (href.includes('#')) return false;
    if (href === '/') return pathname === '/';
    if (href === '/packages')
      return pathname === '/packages' || pathname.startsWith('/category') || pathname.startsWith('/package');
    return pathname.startsWith(href);
  };

  const close = () => { setIsMobileMenuOpen(false); setOpenMobile(null); setOpenMobileSub(null); };
  const toggleMobile = (label: string) => {
    setOpenMobile((prev) => (prev === label ? null : label));
    setOpenMobileSub(null);
  };
  const toggleMobileSub = (label: string) =>
    setOpenMobileSub((prev) => (prev === label ? null : label));

  const portalHref = session?.user
    ? session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN'
      ? '/admin'
      : session.user.role === 'AGENT'
      ? '/agent/dashboard'
      : '/dashboard'
    : '/auth/login';

  return (
    <header className="sticky top-0 z-50 shadow-md">

      {/* ── Row 1: Logo / Opening Hours / Cart / Portal ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-3 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" onClick={close} className="shrink-0">
            <Image
              src="/logo.png"
              alt="FirmCare Logo"
              width={160}
              height={64}
              className="object-contain h-8 w-auto sm:h-10 md:h-12 lg:h-14"
              priority
            />
          </Link>

          {/* Opening Hours — desktop only */}
          <div className="hidden lg:flex items-center gap-8 flex-1 justify-center">
            <div className="flex items-start gap-3">
              <Clock className="w-8 h-8 text-primary mt-0.5 shrink-0" />
              <div className="leading-snug">
                <p className="font-semibold text-gray-800 uppercase tracking-wide text-xs">
                  Monday – Friday 8am – 8pm
                </p>
                <p className="text-gray-500 text-xs">Saturdays 9am – 8pm</p>
                <p className="text-gray-500 text-xs">Sundays 1pm – 5pm</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-6 h-6 text-primary mt-0.5 shrink-0" />
              <div className="leading-snug">
                <p className="font-semibold text-gray-800 text-sm">0808 8743 272</p>
                <p className="text-gray-500 text-sm">0808 1499 391</p>
              </div>
            </div>
          </div>

          {/* Desktop: Cart + Portal */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
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

          {/* Mobile: Cart + Hamburger */}
          <div className="flex lg:hidden items-center gap-2">
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
      </div>

      {/* ── Row 2: Navigation bar (desktop) ── */}
      <nav className="hidden lg:block bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <ul className="flex items-center justify-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = link.href ? isActive(link.href) : false;
              const triggerCls = `flex items-center gap-1 px-3 py-3.5 text-[13px] font-medium transition-colors relative cursor-pointer select-none whitespace-nowrap ${
                active ? 'text-white bg-white/20' : 'text-white/90 hover:text-white hover:bg-white/15'
              }`;
              return (
                <li key={link.label} className="relative group">
                  {link.href ? (
                    <Link href={link.href} className={triggerCls}>
                      {link.label}
                      {link.hasDropdown && (
                        <ChevronDown className="w-3.5 h-3.5 opacity-80 transition-transform duration-200 group-hover:rotate-180" />
                      )}
                      {active && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full" />
                      )}
                    </Link>
                  ) : (
                    <span className={triggerCls}>
                      {link.label}
                      {link.hasDropdown && (
                        <ChevronDown className="w-3.5 h-3.5 opacity-80 transition-transform duration-200 group-hover:rotate-180" />
                      )}
                    </span>
                  )}

                  {/* Animated dropdown */}
                  {link.children && (
                    <ul className="absolute top-full left-0 min-w-55 bg-white shadow-xl rounded-b-lg z-50 pointer-events-none opacity-0 -translate-y-2 scale-y-95 origin-top group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-y-100 transition-all duration-200 ease-out">
                      {link.children.map((child) => (
                        <li key={child.label} className="relative group/sub">
                          {child.href ? (
                            <Link
                              href={child.href}
                              className="flex items-center justify-between gap-2 px-5 py-3.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-primary hover:pl-7 transition-all duration-150 border-b border-gray-100 last:border-0 whitespace-nowrap"
                            >
                              {child.label}
                            </Link>
                          ) : (
                            <>
                              <span className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-primary cursor-default transition-colors border-b border-gray-100 last:border-0 whitespace-nowrap">
                                {child.label}
                                <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                              </span>
                              {'children' in child && child.children && (
                                <ul className="absolute top-0 left-full min-w-60 bg-white shadow-xl rounded-lg overflow-hidden z-50 pointer-events-none opacity-0 -translate-x-2 scale-x-95 origin-left group-hover/sub:pointer-events-auto group-hover/sub:opacity-100 group-hover/sub:translate-x-0 group-hover/sub:scale-x-100 transition-all duration-200 ease-out">
                                  {child.children.map((sub) => (
                                    <li key={sub.href}>
                                      <Link
                                        href={sub.href}
                                        className="flex items-center px-5 py-3.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-primary hover:pl-7 transition-all duration-150 border-b border-gray-100 last:border-0 whitespace-nowrap"
                                      >
                                        {sub.label}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white animate-slideInUp">
          {/* Opening hours on mobile */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 space-y-1 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <span>Mon–Fri 8am–8pm &nbsp;·&nbsp; Sat 9am–8pm &nbsp;·&nbsp; Sun 1pm–5pm</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <span>0808 8743 272 &nbsp;/&nbsp; 0808 1499 391</span>
            </div>
          </div>

          <nav className="px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => {
              const active = link.href ? isActive(link.href) : false;
              const isExpanded = openMobile === link.label;
              const itemCls = `flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                active ? 'text-primary bg-purple-50 font-semibold' : 'text-gray-700 hover:text-primary hover:bg-purple-50'
              }`;
              return (
                <div key={link.label}>
                  {link.children ? (
                    <button onClick={() => toggleMobile(link.label)} className={itemCls}>
                      {link.label}
                      <ChevronDown className={`w-4 h-4 opacity-60 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  ) : link.href ? (
                    <Link href={link.href} onClick={close} className={itemCls}>
                      {link.label}
                    </Link>
                  ) : (
                    <span className={`${itemCls} cursor-default`}>{link.label}</span>
                  )}
                  {link.children && (
                    <div className={`ml-4 overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? 'max-h-96 mt-1' : 'max-h-0'}`}>
                      <div className="space-y-0.5 pb-1">
                        {link.children.map((child) => {
                          const isSubExpanded = openMobileSub === child.label;
                          return (
                            <div key={child.label}>
                              {'children' in child && child.children ? (
                                <>
                                  <button
                                    onClick={() => toggleMobileSub(child.label)}
                                    className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-gray-600 hover:text-primary hover:bg-purple-50 rounded-lg transition-colors"
                                  >
                                    {child.label}
                                    <ChevronDown className={`w-4 h-4 opacity-60 transition-transform duration-200 ${isSubExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                  <div className={`ml-4 overflow-hidden transition-all duration-200 ease-in-out ${isSubExpanded ? 'max-h-60 mt-0.5' : 'max-h-0'}`}>
                                    <div className="space-y-0.5 pb-1">
                                      {child.children.map((sub) => (
                                        <Link
                                          key={sub.href}
                                          href={sub.href}
                                          onClick={close}
                                          className="block px-4 py-2 text-sm text-gray-500 hover:text-primary hover:bg-purple-50 rounded-lg transition-colors"
                                        >
                                          {sub.label}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              ) : child.href ? (
                                <Link
                                  href={child.href}
                                  onClick={close}
                                  className="block px-4 py-2.5 text-sm text-gray-600 hover:text-primary hover:bg-purple-50 rounded-lg transition-colors"
                                >
                                  {child.label}
                                </Link>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
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
