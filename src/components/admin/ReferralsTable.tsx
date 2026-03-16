"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock, Users, UserSquare2, Shield } from "lucide-react";
import { useToast } from "@/context/ToastContext";

type RewardStatus = "PENDING" | "CONFIRMED" | "PAID" | "CANCELLED";
type ReferralType = "USER" | "ADMIN" | "AGENT";

interface Reward {
  id: string;
  amount: any;
  status: RewardStatus;
  referralType: ReferralType;
  createdAt: Date;
  referrer: { id: string; name: string | null; email: string | null; referralCode: string };
  referee:  { id: string; name: string | null; email: string | null };
  booking:  { id: string; totalAmount: any; createdAt: Date; package: { title: string } };
}

const STATUS_CONFIG: Record<RewardStatus, { label: string; icon: typeof Clock; classes: string }> = {
  PENDING:   { label: "Pending",   icon: Clock,        classes: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Confirmed", icon: CheckCircle,  classes: "bg-blue-100 text-blue-800"     },
  PAID:      { label: "Paid",      icon: CheckCircle,  classes: "bg-green-100 text-green-800"   },
  CANCELLED: { label: "Cancelled", icon: XCircle,      classes: "bg-red-100 text-red-800"       },
};

const TYPE_CONFIG: Record<ReferralType, { label: string; icon: typeof Users; classes: string }> = {
  USER:  { label: "User",  icon: Users,       classes: "bg-blue-50 text-blue-700 border-blue-100"    },
  ADMIN: { label: "Admin", icon: Shield,      classes: "bg-orange-50 text-orange-700 border-orange-100" },
  AGENT: { label: "Agent", icon: UserSquare2, classes: "bg-purple-50 text-purple-700 border-purple-100"  },
};

type FilterStatus = RewardStatus | "ALL";
type FilterType   = ReferralType | "ALL_TYPES";

export default function ReferralsTable({ rewards: initial }: { rewards: Reward[] }) {
  const toast = useToast();
  const [rewards, setRewards]       = useState<Reward[]>(initial);
  const [updating, setUpdating]     = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [filterType, setFilterType]     = useState<FilterType>("ALL_TYPES");

  const updateStatus = async (id: string, status: RewardStatus) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/referrals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setRewards((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
        toast.success(`Reward marked as ${status.toLowerCase()}.`);
      } else {
        toast.error("Failed to update reward status.");
      }
    } finally {
      setUpdating(null);
    }
  };

  const filtered = rewards.filter((r) => {
    const statusMatch = filterStatus === "ALL" || r.status === filterStatus;
    const typeMatch   = filterType === "ALL_TYPES" || r.referralType === filterType;
    return statusMatch && typeMatch;
  });

  const countByStatus = (s: RewardStatus) => rewards.filter((r) => r.status === s).length;
  const countByType   = (t: ReferralType)  => rewards.filter((r) => r.referralType === t).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Filters row */}
      <div className="p-4 border-b border-gray-100 space-y-2">
        {/* Status filter */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 mr-1">Status:</span>
          {(["ALL", "PENDING", "PAID", "CANCELLED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                filterStatus === s ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === "ALL" ? `All (${rewards.length})` : `${STATUS_CONFIG[s].label} (${countByStatus(s)})`}
            </button>
          ))}
        </div>
        {/* Type filter */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 mr-1">Type:</span>
          {(["ALL_TYPES", "USER", "ADMIN", "AGENT"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                filterType === t ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t === "ALL_TYPES" ? "All Types" : `${TYPE_CONFIG[t].label} (${countByType(t)})`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No referral rewards match the selected filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3">Referrer</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Referee</th>
                <th className="px-5 py-3">Package</th>
                <th className="px-5 py-3">Booking Value</th>
                <th className="px-5 py-3">Reward</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((reward) => {
                const scfg = STATUS_CONFIG[reward.status];
                const tcfg = TYPE_CONFIG[reward.referralType ?? "USER"];
                const SIcon = scfg.icon;
                const TIcon = tcfg.icon;
                return (
                  <tr key={reward.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{reward.referrer.name ?? "—"}</p>
                      <p className="text-xs text-gray-400">{reward.referrer.email}</p>
                      <p className="text-xs text-primary font-mono mt-0.5">{reward.referrer.referralCode}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${tcfg.classes}`}>
                        <TIcon className="w-3 h-3" />
                        {tcfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{reward.referee.name ?? "—"}</p>
                      <p className="text-xs text-gray-400">{reward.referee.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-700 max-w-[140px] truncate">{reward.booking.package.title}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-700">
                      ₦{Number(reward.booking.totalAmount).toLocaleString()}
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
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${scfg.classes}`}>
                        <SIcon className="w-3 h-3" />
                        {scfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {reward.status === "PENDING" && (
                        <div className="flex items-center gap-1">
                          <button
                            disabled={updating === reward.id}
                            onClick={() => updateStatus(reward.id, "PAID")}
                            className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                          >
                            Mark Paid
                          </button>
                          <button
                            disabled={updating === reward.id}
                            onClick={() => updateStatus(reward.id, "CANCELLED")}
                            className="px-3 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {reward.status === "PAID" && (
                        <span className="text-xs text-gray-400 italic">Paid out</span>
                      )}
                      {reward.status === "CANCELLED" && (
                        <button
                          disabled={updating === reward.id}
                          onClick={() => updateStatus(reward.id, "PENDING")}
                          className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
                        >
                          Restore
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
