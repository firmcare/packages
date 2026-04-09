"use client";

import useSWR from "swr";
import { fmtNgn } from "@/lib/format";
import {
  Users, Calendar, DollarSign, TrendingUp, Eye, ShoppingCart,
  CreditCard, Search, Mail, Tag, MousePointerClick, Activity,
  Globe, ExternalLink, Smartphone, Monitor, Tablet, Chrome, MapPin,
  Link2, BarChart3,
} from "lucide-react";

// ─── DB analytics types ──────────────────────────────────────────────────────

interface DbData {
  totalUsers: number;
  newUsersThisMonth: number;
  totalBookings: number;
  bookingsThisMonth: number;
  totalRevenue: number;
  revenueThisMonth: number;
  popularPackages: Array<{ title: string; _count: { bookings: number } }>;
  bookingsByStatus: Array<{ status: string; _count: number }>;
  recentActivity: Array<{
    id: string; createdAt: string; status: string;
    user: { name: string | null }; package: { title: string };
  }>;
}

// ─── Behaviour data types ─────────────────────────────────────────────────────

interface LabelCount { label: string; count: number }
interface BehaviourData {
  pageviews:   { days: string[]; data: number[] };
  activeUsers: { days: string[]; data: number[] };
  topPages:    Array<{ url: string; fullUrl: string; count: number }>;
  events:      Record<string, number>;
  totals:      { pageviews: number; sessions: number };
  breakdown: {
    countries:  LabelCount[];
    devices:    LabelCount[];
    browsers:   LabelCount[];
    os:         LabelCount[];
    referrers:  LabelCount[];
    utmSources: LabelCount[];
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => Math.round(n).toLocaleString('en-NG');

const STATUS_COLORS: Record<string, string> = {
  COMPLETED:       "bg-green-500",
  CONFIRMED:       "bg-blue-500",
  PENDING:         "bg-yellow-400",
  CANCELLED:       "bg-red-400",
  IN_PROGRESS:     "bg-purple-500",
  RESULTS_READY:   "bg-teal-500",
  SAMPLE_COLLECTED:"bg-orange-400",
};

const DEVICE_ICON: Record<string, React.ElementType> = {
  mobile:  Smartphone,
  tablet:  Tablet,
  desktop: Monitor,
};

const DEVICE_COLOR: Record<string, string> = {
  mobile:  "bg-pink-500",
  tablet:  "bg-orange-400",
  desktop: "bg-blue-500",
};

// Country code → flag emoji
function countryFlag(code: string) {
  if (!code || code.length !== 2) return '🌍';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1F1E6 + c.charCodeAt(0) - 65));
}

function MiniBarChart({ data, color = "bg-primary" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-10">
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${color} opacity-80`}
          style={{ height: `${Math.max((v / max) * 100, 4)}%` }}
        />
      ))}
    </div>
  );
}

function BreakdownBar({ rows, color = "bg-primary" }: { rows: LabelCount[]; color?: string }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-4 text-right shrink-0">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between mb-0.5">
              <span className="text-xs text-gray-700 truncate font-medium">{r.label}</span>
              <span className="text-xs font-bold text-gray-900 ml-2 shrink-0">{fmt(r.count)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className={`${color} h-1.5 rounded-full`} style={{ width: `${((r.count / max) * 100).toFixed(0)}%` }} />
            </div>
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-xs text-gray-400 text-center py-3">No data yet</p>}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AnalyticsDashboard({ data }: { data: DbData }) {
  const { data: beh, isLoading: behLoading } = useSWR<BehaviourData>('/api/admin/analytics/behaviour');

  const userGrowth    = data.totalUsers    > 0 ? ((data.newUsersThisMonth  / data.totalUsers)    * 100).toFixed(1) : "0";
  const bookingGrowth = data.totalBookings > 0 ? ((data.bookingsThisMonth  / data.totalBookings) * 100).toFixed(1) : "0";
  const avgBookingVal = data.totalBookings > 0 ? data.totalRevenue / data.totalBookings : 0;

  const pvSeries  = beh?.pageviews.data.slice(-14)   ?? [];
  const dauSeries = beh?.activeUsers.data.slice(-14) ?? [];
  const ev        = beh?.events ?? {};

  const conversionRate =
    ev['package_viewed'] && ev['checkout_completed']
      ? ((ev['checkout_completed'] / ev['package_viewed']) * 100).toFixed(1)
      : null;

  const topPages   = (beh?.topPages ?? []).filter((p) => !p.url.startsWith('/admin')).slice(0, 8);
  const devices    = beh?.breakdown.devices    ?? [];
  const countries  = beh?.breakdown.countries  ?? [];
  const browsers   = beh?.breakdown.browsers   ?? [];
  const osBreakdown= beh?.breakdown.os         ?? [];
  const referrers  = beh?.breakdown.referrers  ?? [];
  const utmSources = beh?.breakdown.utmSources ?? [];

  const totalDeviceVisits = devices.reduce((a, d) => a + d.count, 0);

  return (
    <div className="space-y-6">

      {/* ── DB Metric Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users,      color: "bg-blue-50 text-blue-600",    label: "Total Users",       value: fmt(data.totalUsers),      sub: `+${data.newUsersThisMonth} this month`, badge: `+${userGrowth}%` },
          { icon: Calendar,   color: "bg-purple-50 text-purple-600",label: "Total Bookings",    value: fmt(data.totalBookings),   sub: `+${data.bookingsThisMonth} this month`, badge: `+${bookingGrowth}%` },
          { icon: DollarSign, color: "bg-green-50 text-green-600",  label: "Total Revenue",     value: fmtNgn(data.totalRevenue), sub: `${fmtNgn(data.revenueThisMonth)} this month` },
          { icon: TrendingUp, color: "bg-orange-50 text-orange-600",label: "Avg Booking Value", value: fmtNgn(avgBookingVal),     sub: "per booking" },
        ].map(({ icon: Icon, color, label, value, sub, badge }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              {badge && <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{badge}</span>}
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Behaviour Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Eye,      color: "bg-indigo-50 text-indigo-600",   label: "Page Views (30d)",
            value: beh ? fmt(beh.totals.pageviews) : "—",
            series: pvSeries, barColor: "bg-indigo-400",
          },
          {
            icon: Users,    color: "bg-cyan-50 text-cyan-600",       label: "Sessions (30d)",
            value: beh ? fmt(beh.totals.sessions) : "—",
            series: dauSeries, barColor: "bg-cyan-400",
          },
          {
            icon: ShoppingCart, color: "bg-pink-50 text-pink-600",   label: "Add to Cart (30d)",
            value: ev['add_to_cart'] != null ? fmt(ev['add_to_cart']) : "—",
            series: [], barColor: "bg-pink-400",
          },
          {
            icon: CreditCard, color: "bg-emerald-50 text-emerald-600", label: "Conversions (30d)",
            value: ev['checkout_completed'] != null ? fmt(ev['checkout_completed']) : "—",
            series: [], barColor: "bg-emerald-400",
            badge: conversionRate ? `${conversionRate}% CVR` : undefined,
          },
        ].map(({ icon: Icon, color, label, value, series, barColor, badge }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              {badge && <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{badge}</span>}
            </div>
            <p className="text-2xl font-bold text-gray-900">{behLoading ? "…" : value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            {series.length > 0 && <div className="mt-3"><MiniBarChart data={series} color={barColor} /></div>}
          </div>
        ))}
      </div>

      {/* ── Device Types ────────────────────────────────────────────── */}
      {devices.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {['mobile', 'desktop', 'tablet'].map((type) => {
            const row  = devices.find((d) => d.label === type);
            const cnt  = row?.count ?? 0;
            const pct  = totalDeviceVisits > 0 ? ((cnt / totalDeviceVisits) * 100).toFixed(1) : "0";
            const Icon = DEVICE_ICON[type] ?? Monitor;
            const bar  = DEVICE_COLOR[type] ?? "bg-gray-400";
            return (
              <div key={type} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bar.replace('bg-', 'bg-').replace('-500', '-50').replace('-400', '-50')} text-${bar.split('-')[1]}-600`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-gray-900">{behLoading ? "…" : pct}%</p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">{type}</p>
                <p className="text-xs text-gray-400">{fmt(cnt)} sessions</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── User Behaviour Funnel ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-700 mb-5 flex items-center gap-2">
          <MousePointerClick className="w-4 h-4 text-primary" /> User Behaviour Funnel (30 days)
        </h3>
        <div className="space-y-3">
          {[
            { label: "Package Views",      icon: Eye,          key: "package_viewed",         color: "bg-indigo-500" },
            { label: "Add to Cart",        icon: ShoppingCart, key: "add_to_cart",             color: "bg-pink-500" },
            { label: "Checkout Started",   icon: Activity,     key: "checkout_started",        color: "bg-orange-500" },
            { label: "Checkout Completed", icon: CreditCard,   key: "checkout_completed",      color: "bg-green-500" },
            { label: "Searches",           icon: Search,       key: "search_performed",        color: "bg-blue-400" },
            { label: "Blog Views",         icon: BarChart3,    key: "blog_post_viewed",        color: "bg-violet-400" },
            { label: "Promos Applied",     icon: Tag,          key: "promo_code_applied",      color: "bg-purple-400" },
            { label: "Contact Forms",      icon: Mail,         key: "contact_form_submitted",  color: "bg-teal-400" },
          ].map(({ label, icon: Icon, key, color }) => {
            const count  = ev[key] ?? 0;
            const maxVal = Math.max(...Object.values(ev), 1);
            const pct    = ((count / maxVal) * 100).toFixed(0);
            return (
              <div key={key} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                    <span className="text-xs font-bold text-gray-900">{behLoading ? "…" : fmt(count)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Top Pages + Countries ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {topPages.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-5 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Top Pages (30 days)
            </h3>
            <div className="space-y-2.5">
              {topPages.map((p, i) => {
                const max = topPages[0]?.count ?? 1;
                const pct = ((p.count / max) * 100).toFixed(0);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-4 shrink-0 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-gray-700 truncate max-w-45 font-mono">{p.url}</span>
                        <span className="text-xs font-bold text-gray-900 ml-2 shrink-0">{fmt(p.count)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-primary/60 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <a href={p.fullUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-gray-300 hover:text-primary">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {countries.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-5 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Top Countries (30 days)
            </h3>
            <div className="space-y-2.5">
              {countries.map((c, i) => {
                const max = countries[0]?.count ?? 1;
                const pct = ((c.count / max) * 100).toFixed(0);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-base w-6 shrink-0">{countryFlag(c.label)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-xs text-gray-700 font-medium">{c.label}</span>
                        <span className="text-xs font-bold text-gray-900">{fmt(c.count)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Browsers + OS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-5 flex items-center gap-2">
            <Chrome className="w-4 h-4 text-primary" /> Browsers (30 days)
          </h3>
          <BreakdownBar rows={browsers} color="bg-blue-400" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-5 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-primary" /> Operating Systems (30 days)
          </h3>
          <BreakdownBar rows={osBreakdown} color="bg-violet-400" />
        </div>
      </div>

      {/* ── Referrers + UTM Sources ─────────────────────────────────── */}
      {(referrers.length > 0 || utmSources.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {referrers.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-700 mb-5 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" /> Top Referrers (30 days)
              </h3>
              <BreakdownBar rows={referrers} color="bg-orange-400" />
            </div>
          )}
          {utmSources.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-700 mb-5 flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" /> UTM Sources (30 days)
              </h3>
              <BreakdownBar rows={utmSources} color="bg-teal-400" />
            </div>
          )}
        </div>
      )}

      {/* ── DB Charts ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-5">Top Packages by Bookings</h3>
          <div className="space-y-3">
            {data.popularPackages.map((pkg, i) => {
              const max = data.popularPackages[0]?._count.bookings ?? 1;
              const pct = ((pkg._count.bookings / max) * 100).toFixed(0);
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-700 truncate">{pkg.title}</span>
                      <span className="text-xs font-bold text-gray-900 ml-2 shrink-0">{pkg._count.bookings}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-5">Bookings by Status</h3>
          <div className="space-y-3">
            {data.bookingsByStatus.map((item) => {
              const pct = data.totalBookings > 0 ? ((item._count / data.totalBookings) * 100).toFixed(1) : "0";
              const bar = STATUS_COLORS[item.status] ?? "bg-gray-400";
              return (
                <div key={item.status}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600">{item.status.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-bold text-gray-900">{item._count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${bar} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Recent Activity ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-700 mb-5">Recent Bookings</h3>
        <div className="divide-y divide-gray-50">
          {data.recentActivity.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{a.user.name || "User"}</span>
                  <span className="text-gray-400"> booked </span>
                  <span className="font-medium">{a.package.title}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                a.status === "COMPLETED" ? "bg-green-100 text-green-700"  :
                a.status === "CONFIRMED" ? "bg-blue-100 text-blue-700"    :
                a.status === "CANCELLED" ? "bg-red-100 text-red-700"      :
                                           "bg-yellow-100 text-yellow-700"
              }`}>{a.status.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
