"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Clock, RefreshCw, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  motivation: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes: string | null;
  createdAt: string;
  processedAt: string | null;
}

const STATUS_TABS = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "All", value: "" },
] as const;

type Tab = (typeof STATUS_TABS)[number]["value"];

const STATUS_BADGE: Record<Application["status"], string> = {
  PENDING:  "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

export default function AgentApplicationsManager() {
  const toast = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("PENDING");
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/agent-applications${tab ? `?status=${tab}` : ""}`);
      if (res.ok) setApps(await res.json());
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/agent-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNotes: notes[id] || "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Action failed.");
        return;
      }
      toast.success(action === "approve" ? "Application approved — agent email sent." : "Application rejected.");
      setExpanded(null);
      await fetchApps();
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === t.value
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={fetchApps}
          className="px-4 py-3 text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
        </div>
      ) : apps.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">
          No {tab.toLowerCase() || ""} applications found.
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {apps.map((app) => (
            <div key={app.id}>
              {/* Row */}
              <div className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{app.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_BADGE[app.status]}`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{app.email}{app.phone ? ` · ${app.phone}` : ""}{app.city ? ` · ${app.city}` : ""}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Applied {new Date(app.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    {app.processedAt ? ` · Processed ${new Date(app.processedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {expanded === app.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {expanded === app.id ? "Collapse" : "Review"}
                </button>
              </div>

              {/* Expanded panel */}
              {expanded === app.id && (
                <div className="px-6 pb-6 bg-gray-50/60 border-t border-gray-100 space-y-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Motivation</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{app.motivation}</p>
                  </div>

                  {app.status === "PENDING" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          Notes (optional — sent to applicant on rejection)
                        </label>
                        <textarea
                          rows={2}
                          value={notes[app.id] ?? ""}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [app.id]: e.target.value }))}
                          placeholder="e.g. We'd like more information about your experience…"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          disabled={processing === app.id}
                          onClick={() => handleAction(app.id, "approve")}
                          className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors"
                        >
                          {processing === app.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Approve & Activate
                        </button>
                        <button
                          disabled={processing === app.id}
                          onClick={() => handleAction(app.id, "reject")}
                          className="flex items-center gap-2 px-5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl disabled:opacity-50 transition-colors border border-red-200"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </>
                  )}

                  {app.status !== "PENDING" && app.adminNotes && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Admin Notes</p>
                      <p className="text-sm text-gray-600 italic">{app.adminNotes}</p>
                    </div>
                  )}

                  {app.status === "APPROVED" && (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      Account activated — approval email sent to agent.
                    </div>
                  )}
                  {app.status === "REJECTED" && (
                    <div className="flex items-center gap-2 text-red-500 text-sm font-semibold">
                      <XCircle className="w-4 h-4" />
                      Application rejected — rejection email sent.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
