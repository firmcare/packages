import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const role = session.user.role as string;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') return null;
  return session;
}

function buildDayRange(days = 30): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    result.push(d.toISOString().split('T')[0]);
  }
  return result;
}

interface DayCount    { day: string; count: number }
interface EventCount  { event: string; count: number }
interface UrlCount    { url: string; count: number }
interface LabelCount  { label: string; count: number }

export async function GET() {
  const session = await requireAdmin();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    pvByDay,
    dauByDay,
    topPagesRaw,
    eventsRaw,
    countryRaw,
    deviceRaw,
    browserRaw,
    osRaw,
    referrerRaw,
    utmSourceRaw,
  ] = await Promise.all([

    // Pageviews per day
    prisma.$queryRaw<DayCount[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') AS day,
        COUNT(*)::int AS count
      FROM "AnalyticsEvent"
      WHERE event = '$pageview' AND "createdAt" >= ${cutoff}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY day ASC
    `,

    // Unique sessions per day (DAU proxy)
    prisma.$queryRaw<DayCount[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') AS day,
        COUNT(DISTINCT "sessionId")::int AS count
      FROM "AnalyticsEvent"
      WHERE event = '$pageview' AND "createdAt" >= ${cutoff}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY day ASC
    `,

    // Top pages
    prisma.$queryRaw<UrlCount[]>`
      SELECT url, COUNT(*)::int AS count
      FROM "AnalyticsEvent"
      WHERE event = '$pageview' AND "createdAt" >= ${cutoff}
      GROUP BY url
      ORDER BY count DESC
      LIMIT 10
    `,

    // Custom event totals
    prisma.$queryRaw<EventCount[]>`
      SELECT event, COUNT(*)::int AS count
      FROM "AnalyticsEvent"
      WHERE event IN (
        'package_viewed','add_to_cart','checkout_started','checkout_completed',
        'search_performed','contact_form_submitted','promo_code_applied',
        'blog_post_viewed','booking_cancelled','result_viewed','agent_applied'
      )
      AND "createdAt" >= ${cutoff}
      GROUP BY event
    `,

    // Country breakdown
    prisma.$queryRaw<LabelCount[]>`
      SELECT COALESCE(country, 'Unknown') AS label, COUNT(*)::int AS count
      FROM "AnalyticsEvent"
      WHERE event = '$pageview' AND "createdAt" >= ${cutoff}
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `,

    // Device type breakdown
    prisma.$queryRaw<LabelCount[]>`
      SELECT COALESCE(device, 'desktop') AS label, COUNT(*)::int AS count
      FROM "AnalyticsEvent"
      WHERE event = '$pageview' AND "createdAt" >= ${cutoff}
      GROUP BY device
      ORDER BY count DESC
    `,

    // Browser breakdown
    prisma.$queryRaw<LabelCount[]>`
      SELECT COALESCE(browser, 'Unknown') AS label, COUNT(*)::int AS count
      FROM "AnalyticsEvent"
      WHERE event = '$pageview' AND browser IS NOT NULL AND "createdAt" >= ${cutoff}
      GROUP BY browser
      ORDER BY count DESC
      LIMIT 8
    `,

    // OS breakdown
    prisma.$queryRaw<LabelCount[]>`
      SELECT COALESCE(os, 'Unknown') AS label, COUNT(*)::int AS count
      FROM "AnalyticsEvent"
      WHERE event = '$pageview' AND os IS NOT NULL AND "createdAt" >= ${cutoff}
      GROUP BY os
      ORDER BY count DESC
      LIMIT 8
    `,

    // Top referrer domains
    prisma.$queryRaw<LabelCount[]>`
      SELECT "referrerDomain" AS label, COUNT(*)::int AS count
      FROM "AnalyticsEvent"
      WHERE event = '$pageview'
        AND "referrerDomain" IS NOT NULL
        AND "createdAt" >= ${cutoff}
      GROUP BY "referrerDomain"
      ORDER BY count DESC
      LIMIT 10
    `,

    // UTM source breakdown
    prisma.$queryRaw<LabelCount[]>`
      SELECT "utmSource" AS label, COUNT(*)::int AS count
      FROM "AnalyticsEvent"
      WHERE "utmSource" IS NOT NULL AND "createdAt" >= ${cutoff}
      GROUP BY "utmSource"
      ORDER BY count DESC
      LIMIT 10
    `,
  ]);

  const days = buildDayRange(30);

  const pvMap  = new Map(pvByDay.map((r)  => [r.day, Number(r.count)]));
  const dauMap = new Map(dauByDay.map((r) => [r.day, Number(r.count)]));
  const pvData  = days.map((d) => pvMap.get(d)  ?? 0);
  const dauData = days.map((d) => dauMap.get(d) ?? 0);

  const events: Record<string, number> = {};
  for (const row of eventsRaw) events[row.event] = Number(row.count);

  const topPages = topPagesRaw.map((r) => {
    let path = r.url;
    try { path = new URL(r.url).pathname; } catch {}
    return { url: path, fullUrl: r.url, count: Number(r.count) };
  });

  const normalise = (rows: LabelCount[]) =>
    rows.map((r) => ({ label: r.label, count: Number(r.count) }));

  return NextResponse.json(
    {
      pageviews:   { days, data: pvData },
      activeUsers: { days, data: dauData },
      topPages,
      events,
      totals: {
        pageviews: pvData.reduce((a, b) => a + b, 0),
        sessions:  dauData.reduce((a, b) => a + b, 0),
      },
      breakdown: {
        countries:  normalise(countryRaw),
        devices:    normalise(deviceRaw),
        browsers:   normalise(browserRaw),
        os:         normalise(osRaw),
        referrers:  normalise(referrerRaw),
        utmSources: normalise(utmSourceRaw),
      },
    },
    { headers: { 'Cache-Control': 'private, max-age=300' } },
  );
}
