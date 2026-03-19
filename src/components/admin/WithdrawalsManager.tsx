"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, AlertCircle, Loader2, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import Pagination from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";

interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface Agent {
  id: string;
  name: string | null;
  email: string;
  referralCode: string;
  bankAccount: BankAccount | null;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  paystackTransferCode: string | null;
  paystackReference: string | null;
  failureReason: string | null;
  processedAt: string | null;
  createdAt: string;
  rewardCount: number;
  agent: Agent;
}

const STATUS_BADGE: Record<string, string> = {
  PENDING:    "bg-yellow-100 text-yellow-700",
  APPROVED:   "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  COMPLETED:  "bg-green-100 text-green-700",
  FAILED:     "bg-red-100 text-red-700",
  REJECTED:   "bg-red-100 text-red-700",
};

const FILTERS = ["ALL", "PENDING", "PROCESSING", "COMPLETED", "FAILED", "REJECTED"] as const;

export default function WithdrawalsManager({ initialWithdrawals }: { initialWithdrawals: Withdrawal[] }) {
  const router = useRouter();
  const toast = useToast();
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [filter, setFilter] = useState<typeof FILTERS[number]>("ALL");
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filter === "ALL" ? withdrawals : withdrawals.filter((w) => w.status === filter);
  const { page, setPage, totalPages, paged, totalItems, pageSize } = usePagination(filtered, 20);

  const fmt = (n: number) =>
    "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

  async function act(id: string, action: string, extra?: Record<string, string>) {
    setLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Action failed");
      } else {
        toast.success("Done");
        router.refresh();
        // optimistic update
        const statusMap: Record<string, string> = {
          approve: "PROCESSING",
          reject: "REJECTED",
          complete: "COMPLETED",
          mark_failed: "FAILED",
        };
        setWithdrawals((prev) =>
          prev.map((w) => (w.id === id ? { ...w, status: statusMap[action] ?? w.status } : w))
        );
      }
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Filter tabs */}
      <div className="flex gap-1 p-3 border-b border-gray-100 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === f ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-12">No withdrawals found.</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {paged.map((w) => {
            const expanded = expandedId === w.id;
            const busy = loading[w.id];

            return (
              <div key={w.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: agent info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900">{w.agent.name ?? w.agent.email}</p>
                      <span className="text-xs text-gray-400">#{w.agent.referralCode}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[w.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {w.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{w.agent.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {fmtDate(w.createdAt)} · {w.rewardCount} reward{w.rewardCount !== 1 ? "s" : ""}
                      {w.paystackReference && ` · Ref: ${w.paystackReference}`}
                    </p>
                    {w.failureReason && (
                      <p className="text-xs text-red-500 mt-1">{w.failureReason}</p>
                    )}
                  </div>

                  {/* Right: amount + actions */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-gray-900">{fmt(w.amount)}</p>
                    <button
                      onClick={() => setExpandedId(expanded ? null : w.id)}
                      className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5 ml-auto mt-1"
                    >
                      Details {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                    {/* Bank account */}
                    {w.agent.bankAccount ? (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="font-medium">{w.agent.bankAccount.bankName}</span>
                        <span className="text-gray-500">— {w.agent.bankAccount.accountNumber}</span>
                        <span className="text-gray-400">({w.agent.bankAccount.accountName})</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        No bank account on file
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 items-start">
                      {w.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => act(w.id, "approve")}
                            disabled={busy || !w.agent.bankAccount}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Approve & Transfer
                          </button>
                          <div className="flex gap-2 items-center flex-1 min-w-0">
                            <input
                              type="text"
                              placeholder="Rejection reason…"
                              value={rejectReason[w.id] ?? ""}
                              onChange={(e) => setRejectReason((p) => ({ ...p, [w.id]: e.target.value }))}
                              className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
                            />
                            <button
                              onClick={() => act(w.id, "reject", { reason: rejectReason[w.id] })}
                              disabled={busy}
                              className="flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors shrink-0"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        </>
                      )}

                      {w.status === "PROCESSING" && (
                        <>
                          <button
                            onClick={() => act(w.id, "complete")}
                            disabled={busy}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Mark Completed
                          </button>
                          <button
                            onClick={() => act(w.id, "mark_failed")}
                            disabled={busy}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Mark Failed
                          </button>
                        </>
                      )}

                      {(w.status === "COMPLETED" || w.status === "FAILED" || w.status === "REJECTED") && (
                        <p className="text-xs text-gray-400 italic">
                          {w.processedAt ? `Processed ${fmtDate(w.processedAt)}` : "No further actions available"}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {filtered.length > 0 && (
        <div className="px-5 pb-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </div>
      )}
    </div>
  );
}
