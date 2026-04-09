'use client';

import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { trackEvent } from '@/lib/analytics';

// ─── Typed event catalogue ───────────────────────────────────────────────────

type PackageViewedEvent    = { package_id: string; package_title: string; package_price: number; category?: string };
type AddToCartEvent        = { package_id: string; package_title: string; package_price: number };
type CheckoutStartedEvent  = { total: number; item_count: number };
type CheckoutCompletedEvent= { total: number; item_count: number; booking_ids: string[] };
type SearchEvent           = { query: string; result_count?: number };
type BlogViewedEvent       = { slug: string; title: string; author?: string };
type ContactSubmittedEvent = Record<string, never>;
type PromoAppliedEvent     = { code: string; discount?: number };
type BookingCancelledEvent = { booking_id: string };
type FilterAppliedEvent    = { filter_type: string; value: string };
type AgentAppliedEvent     = Record<string, never>;
type ResultViewedEvent     = { booking_id: string; package_title: string };

type Events = {
  package_viewed:         PackageViewedEvent;
  add_to_cart:            AddToCartEvent;
  checkout_started:       CheckoutStartedEvent;
  checkout_completed:     CheckoutCompletedEvent;
  search_performed:       SearchEvent;
  blog_post_viewed:       BlogViewedEvent;
  contact_form_submitted: ContactSubmittedEvent;
  promo_code_applied:     PromoAppliedEvent;
  booking_cancelled:      BookingCancelledEvent;
  filter_applied:         FilterAppliedEvent;
  agent_applied:          AgentAppliedEvent;
  result_viewed:          ResultViewedEvent;
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAnalytics() {
  const { data: session } = useSession();

  const track = useCallback(
    <E extends keyof Events>(event: E, properties: Events[E]) => {
      const userId = (session?.user as { id?: string })?.id;
      trackEvent(event as string, properties as Record<string, unknown>, userId);
    },
    [session],
  );

  return { track };
}
