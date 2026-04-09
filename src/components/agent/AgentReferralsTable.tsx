"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { fmtNgn } from "@/lib/format";

type RewardStatus = "PENDING" | "CONFIRMED" | "PAID" | "CANCELLED";

interface Reward {
  id: string;
  amount: number;
  status: RewardStatus;
  createdAt: string;
  referee: { name: string | null; email: string | null };
  booking: { id: string; totalAmount: number; createdAt: string; package: { title: string } } | null;
}

const STATUS_CONFIG: Record<RewardStatus, { label: string; icon: typeof Clock; classes: string }> = {
  PENDING:   { label: "Pending",   icon: Clock,       classes: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Confirmed", icon: CheckCircle, classes: "bg-blue-100 text-blue-800"     },
  PAID:      { label: "Paid",      icon: CheckCircle, classes: "bg-green-100 text-green-800"   },
  CANCELLED: { label: "Cancelled", icon: XCircle,     classes: "bg-red-100 text-red-800"       },
};

export default function AgentReferralsTable({ rewards: initial }: { rewards: Reward[] }) {
  const [filter, setFilter] = useState<RewardStatus | "ALL">("ALL");
  const filtered = filter === "ALL" ? initial : initial.filter((r) => r.status === filter);
  const { page, setPage, totalPages, paged, totalItems, pageSize } = usePagination(filtered, 15);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Filter */}
      <div className="flex items-center gap-1 p-4 border-b border-gray-100 overflow-x-auto">
        {(["ALL", "PENDING", "PAID", "CANCELLED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
              filter === s ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "ALL"
              ? `All (${initial.length})`
              : `${STATUS_CONFIG[s].label} (${initial.filter((r) => r.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No referral rewards yet.</p>
          <p className="text-xs mt-1">Share your referral code to start earning.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Package</th>
                <th className="px-5 py-3">Booking Value</th>
                <th className="px-5 py-3">Your Reward</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.map((reward) => {
                const cfg = STATUS_CONFIG[reward.status];
                const Icon = cfg.icon;
                return (
                  <tr key={reward.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{reward.referee.name ?? "—"}</p>
                      <p className="text-xs text-gray-400">{reward.referee.email}</p>
                    </td>
                    <td className="px-5 py-4 max-w-[180px]">
                      <p className="text-gray-700 truncate">{reward.booking?.package.title ?? "—"}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-700">
                      {reward.booking ? fmtNgn(reward.booking.totalAmount) : "—"}
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-900">
                      ₦{Number(reward.amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(reward.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.classes}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
