'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { trackEvent } from '@/lib/analytics';

function AnalyticsInner() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Track every page view — anonymous hit when unconsented, enriched when consented
  useEffect(() => {
    const userId = (session?.user as { id?: string })?.id;
    trackEvent('$pageview', {}, userId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]); // re-run on every route change

  return null;
}

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsInner />
      </Suspense>
      {children}
    </>
  );
}
