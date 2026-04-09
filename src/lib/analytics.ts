/**
 * Self-hosted analytics — client-side helpers.
 *
 * Manages persistent visitorId (localStorage), per-session sessionId
 * (sessionStorage), checks cookie consent, captures UTM params + screen
 * dimensions, then POSTs to /api/analytics/event.
 *
 * All functions are client-only (guarded by typeof window check).
 */

export const CONSENT_KEY = 'fc_consent';
const VISITOR_KEY        = 'fc_vid';
const SESSION_KEY        = 'fc_sid';

// ─── Consent ─────────────────────────────────────────────────────────────────

export interface ConsentState {
  analytics: boolean;
  timestamp: number;
}

export function getConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? (JSON.parse(raw) as ConsentState) : null;
  } catch { return null; }
}

export function setConsent(analytics: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics, timestamp: Date.now() }));
    // Dispatch so other components (e.g. banner) can react
    window.dispatchEvent(new Event('fc_consent_change'));
  } catch {}
}

export function hasAnalyticsConsent(): boolean {
  return getConsent()?.analytics === true;
}

// ─── Session management ───────────────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Persistent browser identifier — survives page refreshes and new tabs. */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) { id = generateId(); localStorage.setItem(VISITOR_KEY, id); }
    return id;
  } catch { return ''; }
}

/** Per-browser-session identifier — resets when the tab/window is closed. */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) { id = generateId(); sessionStorage.setItem(SESSION_KEY, id); }
    return id;
  } catch { return generateId(); }
}

// ─── UTM extraction ───────────────────────────────────────────────────────────

interface UtmParams {
  utmSource?:   string;
  utmMedium?:   string;
  utmCampaign?: string;
  utmTerm?:     string;
  utmContent?:  string;
}

function extractUtm(url: string): UtmParams {
  try {
    const params = new URL(url).searchParams;
    const get = (key: string) => params.get(key) || undefined;
    return {
      utmSource:   get('utm_source'),
      utmMedium:   get('utm_medium'),
      utmCampaign: get('utm_campaign'),
      utmTerm:     get('utm_term'),
      utmContent:  get('utm_content'),
    };
  } catch { return {}; }
}

// ─── trackEvent ───────────────────────────────────────────────────────────────

/**
 * Fire-and-forget event ingestion. Never throws.
 *
 * Always fires — even without consent — but only attaches sessionId,
 * visitorId, and screenDimensions when the user has granted analytics
 * consent. Without consent, the event is stored as an anonymous hit
 * (URL, country, device type, referrer domain) with no client identifiers.
 */
export function trackEvent(
  event: string,
  properties: Record<string, unknown> = {},
  userId?: string,
): void {
  if (typeof window === 'undefined') return;

  const consented    = hasAnalyticsConsent();
  const url          = window.location.href;
  const referrer     = document.referrer || undefined;
  const utm          = extractUtm(url);

  // Only attach client-side identifiers and screen dimensions when consented
  const identifiers = consented
    ? {
        sessionId:    getSessionId(),
        visitorId:    getVisitorId(),
        screenWidth:  window.screen?.width,
        screenHeight: window.screen?.height,
      }
    : {};

  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,   // survives page navigation
    body: JSON.stringify({
      event,
      sessionId: '',   // overridden below if consented
      url,
      referrer,
      properties,
      userId,
      ...utm,
      ...identifiers,
    }),
  }).catch(() => {});
}
