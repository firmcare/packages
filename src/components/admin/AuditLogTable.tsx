"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import { Shield, Search, Filter, Download, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import DateRangeFilter, { DateRange } from "@/components/ui/DateRangeFilter";

// ── Date helpers ──────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  resourceName: string | null;
  detail: string | null;
  metadata: string | null;
  ip: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string | null;
    email: string | null;
    role: { name: string };
  };
}

interface PageData {
  logs: AuditEntry[];
  total: number;
  page: number;
  pages: number;
}

// ── Action catalogue ─────────────────────────────────────────────────────────

const ACTION_META: Record<string, { label: string; color: string; category: string }> = {
  // Bookings
  BOOKING_STATUS_UPDATE:      { label: "Status Update",       color: "bg-blue-100 text-blue-700",     category: "Bookings" },
  BOOKING_NOTES_UPDATE:       { label: "Notes Updated",       color: "bg-blue-50  text-blue-500",     category: "Bookings" },
  BOOKING_RESULT_UPLOADED:    { label: "Result Uploaded",     color: "bg-cyan-100 text-cyan-700",     category: "Bookings" },
  // Packages
  PACKAGE_CREATED:            { label: "Package Created",     color: "bg-green-100 text-green-700",   category: "Packages" },
  PACKAGE_UPDATED:            { label: "Package Updated",     color: "bg-yellow-100 text-yellow-700", category: "Packages" },
  PACKAGE_DELETED:            { label: "Package Deleted",     color: "bg-red-100 text-red-700",       category: "Packages" },
  PACKAGE_TOGGLED:            { label: "Package Toggled",     color: "bg-yellow-50 text-yellow-600",  category: "Packages" },
  // Tests
  TEST_CREATED:               { label: "Test Created",        color: "bg-green-100 text-green-700",   category: "Tests" },
  TEST_UPDATED:               { label: "Test Updated",        color: "bg-yellow-100 text-yellow-700", category: "Tests" },
  TEST_DELETED:               { label: "Test Deleted",        color: "bg-red-100 text-red-700",       category: "Tests" },
  // Promos
  PROMO_CREATED:              { label: "Promo Created",       color: "bg-green-100 text-green-700",   category: "Promos" },
  PROMO_UPDATED:              { label: "Promo Updated",       color: "bg-yellow-100 text-yellow-700", category: "Promos" },
  PROMO_DELETED:              { label: "Promo Deleted",       color: "bg-red-100 text-red-700",       category: "Promos" },
  PROMO_TOGGLED:              { label: "Promo Toggled",       color: "bg-yellow-50 text-yellow-600",  category: "Promos" },
  // Agents
  AGENT_CREATED:              { label: "Agent Created",       color: "bg-green-100 text-green-700",   category: "Agents" },
  AGENT_DEACTIVATED:          { label: "Agent Deactivated",   color: "bg-red-100 text-red-700",       category: "Agents" },
  AGENT_REACTIVATED:          { label: "Agent Reactivated",   color: "bg-emerald-100 text-emerald-700", category: "Agents" },
  AGENT_APPLICATION_APPROVED: { label: "Agent Approved",      color: "bg-green-100 text-green-700",   category: "Agents" },
  AGENT_APPLICATION_REJECTED: { label: "Agent Rejected",      color: "bg-red-100 text-red-700",       category: "Agents" },
  // Admins / Users
  ADMIN_CREATED:              { label: "Admin Created",       color: "bg-green-100 text-green-700",   category: "Admins" },
  ADMIN_UPGRADED:             { label: "Admin Upgraded",      color: "bg-green-100 text-green-700",   category: "Admins" },
  ADMIN_DEACTIVATED:          { label: "Admin Deactivated",   color: "bg-red-100 text-red-700",       category: "Admins" },
  ADMIN_REACTIVATED:          { label: "Admin Reactivated",   color: "bg-emerald-100 text-emerald-700", category: "Admins" },
  ADMIN_PASSWORD_RESET:       { label: "Password Reset",      color: "bg-orange-100 text-orange-700", category: "Admins" },
  ROLE_CHANGE:                { label: "Role Changed",        color: "bg-purple-100 text-purple-700", category: "Admins" },
  USER_ROLE_CHANGE:           { label: "User Role Changed",   color: "bg-purple-100 text-purple-700", category: "Admins" },
  // Withdrawals
  WITHDRAWAL_APPROVED:        { label: "Withdrawal Approved", color: "bg-green-100 text-green-700",   category: "Withdrawals" },
  WITHDRAWAL_COMPLETED:       { label: "Withdrawal Completed",color: "bg-emerald-100 text-emerald-700", category: "Withdrawals" },
  WITHDRAWAL_REJECTED:        { label: "Withdrawal Rejected", color: "bg-red-100 text-red-700",       category: "Withdrawals" },
  WITHDRAWAL_FAILED:          { label: "Withdrawal Failed",   color: "bg-red-100 text-red-600",       category: "Withdrawals" },
  // Referrals
  REFERRAL_STATUS_UPDATE:     { label: "Referral Updated",    color: "bg-indigo-100 text-indigo-700", category: "Referrals" },
  // Settings
  SETTINGS_UPDATED:           { label: "Settings Updated",    color: "bg-gray-100 text-gray-700",     category: "Settings" },
};

const CATEGORIES = ["All", "Bookings", "Packages", "Tests", "Promos", "Agents", "Admins", "Withdrawals", "Referrals", "Settings"];

const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: "text-red-600 font-semibold",
  ADMIN:      "text-purple-600 font-semibold",
};

// ── Component ────────────────────────────────────────────────────────────────

export default function AuditLogTable() {
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState("");
  const [category,   setCategory]   = useState("All");
  const [dateRange,  setDateRange]  = useState<DateRange>({ from: todayStr(), to: todayStr() });
  const [expanded,   setExpanded]   = useState<Set<string>>(new Set());
  const [exporting,  setExporting]  = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, category, dateRange]);

  // Build query params helper (also used by export)
  const buildParams = useCallback((p: number, searchVal: string) => {
    const params = new URLSearchParams({ page: String(p) });
    if (searchVal)          params.set("search",   searchVal);
    if (category !== "All") params.set("category", category);
    if (dateRange.from)     params.set("from",     dateRange.from);
    if (dateRange.to)       params.set("to",       dateRange.to);
    return params;
  }, [category, dateRange]);

  const auditUrl = `/api/admin/audit?${buildParams(page, debouncedSearch)}`;
  const { data, isLoading: loading } = useSWR<PageData>(auditUrl);

  // Prevent clearing date range to "all time" in the UI view
  const handleDateRangeChange = (r: DateRange) => {
    if (!r.from && !r.to) {
      setDateRange({ from: todayStr(), to: todayStr() });
    } else {
      setDateRange(r);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Export is always all-time — only search + category filters apply, no date range
      const params = new URLSearchParams({ page: "1" });
      if (search)          params.set("search",   search);
      if (category !== "All") params.set("category", category);
      params.set("format", "csv");
      const res = await fetch(`/api/admin/audit?${params}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-NG", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const parseMetadata = (raw: string | null): Record<string, unknown> | null => {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 space-y-3">
        {/* Row 1: search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by admin, resource, or detail…"
            className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        {/* Row 2: category filter + export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 h-9 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            title="Exports all matching logs — all time, no date filter"
            className="flex items-center gap-1.5 h-9 px-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors shrink-0"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
        {/* Row 3: date range — "All time" hidden; view always requires a date window */}
        <DateRangeFilter value={dateRange} onChange={handleDateRangeChange} hideAllTime />
      </div>

      {/* ── Summary bar ── */}
      {data && !loading && (
        <div className="px-5 py-2 bg-gray-50/60 border-b border-gray-100 text-xs text-gray-500">
          {data.total.toLocaleString()} entr{data.total === 1 ? "y" : "ies"} · page {data.page} of {data.pages}
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : !data || data.logs.length === 0 ? (
        <div className="text-center py-14">
          <Shield className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No audit entries found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/40">
                  <th className="w-4 px-3 py-3" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">When</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Target</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.logs.map((log) => {
                  const meta    = ACTION_META[log.action];
                  const isOpen  = expanded.has(log.id);
                  const parsed  = parseMetadata(log.metadata);
                  const hasMore = parsed || log.ip || log.resourceId;

                  return (
                    <>
                      <tr
                        key={log.id}
                        onClick={() => hasMore && toggleExpand(log.id)}
                        className={`transition-colors ${hasMore ? "cursor-pointer hover:bg-gray-50/70" : "hover:bg-gray-50/40"} ${isOpen ? "bg-gray-50/60" : ""}`}
                      >
                        {/* Expand indicator */}
                        <td className="px-3 py-3 text-gray-300">
                          {hasMore
                            ? isOpen
                              ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                              : <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                            : null}
                        </td>

                        {/* Timestamp */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-xs text-gray-500">{fmt(log.createdAt)}</p>
                        </td>

                        {/* Actor */}
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 truncate max-w-32 text-xs">
                            {log.actor.name ?? log.actor.email ?? "Unknown"}
                          </p>
                          <p className={`text-xs ${ROLE_COLORS[log.actor.role.name] ?? "text-gray-400"}`}>
                            {log.actor.role.name}
                          </p>
                        </td>

                        {/* Action badge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${meta?.color ?? "bg-gray-100 text-gray-600"}`}>
                            {meta?.label ?? log.action}
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5">{log.resource}</p>
                        </td>

                        {/* Resource name */}
                        <td className="px-4 py-3">
                          {log.resourceName ? (
                            <p className="text-xs font-medium text-gray-800 truncate max-w-36">{log.resourceName}</p>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>

                        {/* Detail (desktop only) */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-xs text-gray-500 max-w-xs truncate" title={log.detail ?? ""}>
                            {log.detail ?? "—"}
                          </p>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isOpen && (
                        <tr key={log.id + "-expanded"} className="bg-gray-50/80">
                          <td />
                          <td colSpan={5} className="px-4 py-3 pb-4">
                            <div className="space-y-3 text-xs">
                              {log.detail && (
                                <p className="text-gray-600">{log.detail}</p>
                              )}
                              {parsed && Object.keys(parsed).length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(parsed).map(([k, v]) => (
                                    <span key={k} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-lg text-gray-700">
                                      <span className="text-gray-400">{k}:</span>
                                      <span className="font-medium">{String(v)}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="flex flex-wrap gap-4 text-gray-400">
                                {log.resourceId && (
                                  <span>ID: <span className="font-mono text-gray-500">{log.resourceId}</span></span>
                                )}
                                {log.ip && (
                                  <span>IP: <span className="font-mono text-gray-500">{log.ip}</span></span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {data.pages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-4">
              <p className="text-xs text-gray-500">
                Showing {((data.page - 1) * 50) + 1}–{Math.min(data.page * 50, data.total)} of {data.total.toLocaleString()}
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={data.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(5, data.pages) }, (_, i) => {
                  const start = Math.max(1, Math.min(data.page - 2, data.pages - 4));
                  const p = start + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-7 text-xs font-medium rounded-lg transition-colors ${p === data.page ? "bg-primary text-white" : "border border-gray-200 hover:bg-gray-50 text-gray-600"}`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  disabled={data.page >= data.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
