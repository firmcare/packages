
import React from 'react';
import { Facebook, Twitter, Instagram, MapPin, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

const SOCIAL_LINKS = [
  { icon: Facebook, href: 'https://facebook.com/firmcare', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/firmcare', label: 'Twitter / X' },
  { icon: Instagram, href: 'https://instagram.com/firmcare', label: 'Instagram' },
];

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#2e1a2e] text-white pt-16 pb-0 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

          {/* Brand + Address */}
          <div className="lg:col-span-1">
            <div className="mb-5">
              <h2 className="text-xl font-extrabold tracking-tight">FirmCare</h2>
              <p className="text-xs text-pink-300 mt-0.5 uppercase tracking-widest">Health Diagnostics</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-300 leading-relaxed mb-6">
              <MapPin className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
              <span>
                No 3, Bouar Close, by Jevenik Restaurant, Beside St. Francois Hospital, off Bangui Street,
                off Adetokunbo Crescent, Wuse 2, Abuja
              </span>
            </div>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-pink-500/60 flex items-center justify-center text-pink-400 hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Packages */}
          <div>
            <h4 className="font-bold text-sm mb-5 uppercase tracking-wider text-white/70">Packages</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>
                <Link href="/category/all" className="hover:text-pink-400 transition-colors">
                  Browse Packages
                </Link>
              </li>
              <li>
                <Link href="/custom-package" className="hover:text-pink-400 transition-colors">
                  Custom Package
                </Link>
              </li>
              <li>
                <Link href="/category/all" className="hover:text-pink-400 transition-colors">
                  Full Test Menu
                </Link>
              </li>
            </ul>
          </div>

          {/* Patient */}
          <div>
            <h4 className="font-bold text-sm mb-5 uppercase tracking-wider text-white/70">Patient</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>
                <Link href="/auth/login" className="hover:text-pink-400 transition-colors">
                  Patient Portal
                </Link>
              </li>
              <li>
                <Link href="/dashboard/bookings" className="hover:text-pink-400 transition-colors">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="hover:text-pink-400 transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-sm mb-5 uppercase tracking-wider text-white/70">Contact Us</h4>
            <ul className="space-y-4 text-sm text-gray-300">
              <li>
                <a href="tel:092916883" className="flex items-center gap-2 hover:text-pink-400 transition-colors">
                  <Phone className="w-4 h-4 text-pink-400/70 shrink-0" />
                  09-291-6883
                </a>
              </li>
              <li>
                <a href="tel:08088743272" className="flex items-center gap-2 hover:text-pink-400 transition-colors">
                  <Phone className="w-4 h-4 text-pink-400/70 shrink-0" />
                  0808-874-3272
                </a>
              </li>
              <li>
                <a href="mailto:info@firmcare.com.ng" className="flex items-center gap-2 hover:text-pink-400 transition-colors">
                  <Mail className="w-4 h-4 text-pink-400/70 shrink-0" />
                  info@firmcare.com.ng
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Copyright bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-5 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} FirmCare Health Diagnostics. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-pink-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-pink-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div className="absolute bottom-8 left-0 w-full overflow-hidden pointer-events-none opacity-[0.04]">
        <p className="text-[160px] sm:text-[200px] font-black text-white text-center tracking-tighter leading-none select-none">
          FIRMCARE
        </p>
      </div>
    </footer>
  );
};

export default Footer;
