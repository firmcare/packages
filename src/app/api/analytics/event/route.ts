export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { UAParser } from 'ua-parser-js';

// ─── Bot detection ────────────────────────────────────────────────────────────
// Covers: search crawlers, SEO tools, monitoring, HTTP clients, headless browsers
const BOT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|twitterbot|linkedinbot|whatsapp|uptimerobot|pingdom|curl|wget|python-requests|python-urllib|java\/|go-http-client|scrapy|headless|phantom|selenium|puppeteer|playwright|ahrefsbot|semrushbot|moz\.com|dotbot|rogerbot|exabot|ia_archiver|baiduspider|yandexbot|duckduckbot|sogoubot|exalead|petalbot|bytespider|gptbot|claude-web|ccbot|amazonbot|applebot|bingpreview|facebot|flipboard|embedly/i;

function isBot(ua: string): boolean {
  if (!ua || ua.length < 10) return true;          // empty / tiny UA = bot
  if (BOT_PATTERN.test(ua)) return true;
  return false;
}

// ─── IP extraction ────────────────────────────────────────────────────────────
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ??          // Cloudflare
    req.headers.get('x-real-ip') ??                 // nginx
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    '127.0.0.1'
  );
}

// ─── Referrer domain ─────────────────────────────────────────────────────────
function extractDomain(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch { return undefined; }
}

// ─── In-memory geo cache (keyed by /24 subnet to avoid caching personal IPs) ─
type GeoResult = { country?: string; city?: string; region?: string } | null;
const geoCache = new Map<string, GeoResult>();
let geoipLib: { lookup: (ip: string) => GeoResult } | null = null;
let geoipFailed = false;

async function loadGeoip() {
  if (geoipFailed || geoipLib) return geoipLib;
  try {
    geoipLib = (await import('geoip-lite')).default as unknown as typeof geoipLib;
  } catch {
    geoipFailed = true;
  }
  return geoipLib;
}

async function lookupGeo(ip: string): Promise<GeoResult> {
  const subnet = ip.split('.').slice(0, 3).join('.');    // e.g. 197.210.84
  if (geoCache.has(subnet)) return geoCache.get(subnet)!;
  const lib = await loadGeoip();
  const result = lib ? lib.lookup(ip) : null;
  if (geoCache.size > 5000) geoCache.clear();            // simple cap
  geoCache.set(subnet, result);
  return result;
}

// ─── Validation schema ────────────────────────────────────────────────────────
const schema = z.object({
  event:        z.string().min(1).max(100),
  sessionId:    z.string().min(1).max(128),
  visitorId:    z.string().max(128).optional(),
  url:          z.string().max(2000),
  referrer:     z.string().max(2000).optional(),
  properties:   z.record(z.string(), z.unknown()).optional().default({}),
  userId:       z.string().optional(),
  // UTM
  utmSource:    z.string().max(200).optional(),
  utmMedium:    z.string().max(200).optional(),
  utmCampaign:  z.string().max(200).optional(),
  utmTerm:      z.string().max(200).optional(),
  utmContent:   z.string().max(200).optional(),
  // Viewport
  screenWidth:  z.number().int().positive().max(10000).optional(),
  screenHeight: z.number().int().positive().max(10000).optional(),
});

// ─── Route ────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const userAgent = req.headers.get('user-agent') ?? '';

    // Silently drop bots
    if (isBot(userAgent)) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const body = await req.json();
    const data = schema.parse(body);

    // UA parsing
    const parser  = new UAParser(userAgent);
    const browser = parser.getBrowser();
    const device  = parser.getDevice();
    const os      = parser.getOS();
    const deviceType = device.type ?? 'desktop'; // undefined = desktop

    // Geo lookup (no IP stored)
    const ip  = getClientIp(req);
    const geo = await lookupGeo(ip);

    // Referrer domain — exclude self-referrals
    let referrerDomain = extractDomain(data.referrer);
    try {
      const ownHost = new URL(data.url).hostname;
      if (referrerDomain === ownHost.replace(/^www\./, '')) referrerDomain = undefined;
    } catch {}

    await prisma.analyticsEvent.create({
      data: {
        event:          data.event,
        sessionId:      data.sessionId,
        visitorId:      data.visitorId,
        userId:         data.userId,
        url:            data.url,
        referrer:       data.referrer,
        referrerDomain,
        properties:     data.properties as object,
        // Geo
        country:        geo?.country,
        city:           geo?.city || undefined,
        region:         geo?.region || undefined,
        // Device / UA
        device:         deviceType,
        browser:        browser.name,
        browserVersion: browser.major,
        os:             os.name,
        // UTM
        utmSource:      data.utmSource,
        utmMedium:      data.utmMedium,
        utmCampaign:    data.utmCampaign,
        utmTerm:        data.utmTerm,
        utmContent:     data.utmContent,
        // Viewport
        screenWidth:    data.screenWidth,
        screenHeight:   data.screenHeight,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
