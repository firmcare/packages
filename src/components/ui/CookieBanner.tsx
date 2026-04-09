'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cookie, X, Check, Settings2 } from 'lucide-react';
import { getConsent, setConsent } from '@/lib/analytics';

// Routes that should never show the cookie banner
const PRIVATE_PREFIXES = ['/admin', '/agent', '/dashboard'];

type View = 'banner' | 'preferences';

export default function CookieBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [view, setView]       = useState<View>('banner');
  const [analyticsOn, setAnalyticsOn] = useState(true);

  const isPrivateRoute = PRIVATE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    // Never show on authenticated/internal routes
    if (isPrivateRoute) { setVisible(false); return; }
    // Never show if user has already made a consent decision (accept OR reject)
    if (getConsent() !== null) { setVisible(false); return; }
    // No prior decision — prompt the user
    setVisible(true);

    // Hide if user makes a decision via another tab or component
    const handler = () => setVisible(false);
    window.addEventListener('fc_consent_change', handler);
    return () => window.removeEventListener('fc_consent_change', handler);
  }, [isPrivateRoute]);

  function acceptAll() {
    setConsent(true);
    setVisible(false);
  }

  function rejectAll() {
    setConsent(false);
    setVisible(false);
  }

  function savePreferences() {
    setConsent(analyticsOn);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[9999] p-3 sm:p-4 md:p-6 animate-slideUp"
    >
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

        {view === 'banner' ? (
          /* ── Main banner ─────────────────────────────────────────────── */
          <div className="flex flex-col sm:flex-row gap-4 p-5 sm:p-6 items-start sm:items-center">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 mb-1">We value your privacy</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                We use cookies and similar technologies to analyse site usage and improve your experience.
                Analytics data is collected anonymously and never sold to third parties.{' '}
                <Link href="/privacy" className="text-primary underline hover:text-primary/80" onClick={() => setVisible(false)}>
                  Privacy Policy
                </Link>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setView('preferences')}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5" />
                Preferences
              </button>
              <button
                onClick={rejectAll}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-2 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Reject All
              </button>
              <button
                onClick={acceptAll}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Accept All
              </button>
            </div>
          </div>
        ) : (
          /* ── Preferences panel ───────────────────────────────────────── */
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" /> Cookie Preferences
              </h3>
              <button
                onClick={() => setView('banner')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Back"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Essential — always on */}
            <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">Essential Cookies</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Required for authentication, shopping cart, and booking functionality. Cannot be disabled.
                </p>
              </div>
              <div className="shrink-0">
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Always On</span>
              </div>
            </div>

            {/* Analytics — toggleable */}
            <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">Analytics Cookies</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Help us understand how visitors use our site so we can improve it. Data is anonymised
                  and stored on our own servers — never shared with third parties.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={analyticsOn}
                onClick={() => setAnalyticsOn((v) => !v)}
                className={`shrink-0 relative w-10 h-5.5 rounded-full transition-colors duration-200 ${analyticsOn ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-200 ${analyticsOn ? 'translate-x-[18px]' : 'translate-x-0'}`}
                />
              </button>
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={rejectAll}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 px-4 py-2 rounded-lg transition-colors"
              >
                Reject All
              </button>
              <button
                onClick={savePreferences}
                className="text-xs font-semibold text-white bg-primary hover:bg-primary/90 px-5 py-2 rounded-lg transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
