"use client";

import { useState } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { CheckCircle, XCircle, Clock, Users, UserSquare2, Shield, X, Loader2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import Pagination, { PageSizeSelector } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import DateRangeFilter, { DateRange, inRange } from "@/components/ui/DateRangeFilter";
import { fmtNgn as fmt } from "@/lib/format";

type RewardStatus = "PENDING" | "CONFIRMED" | "PAID" | "CANCELLED";
type ReferralType = "USER" | "ADMIN" | "AGENT";

interface Reward {
  id: string;
  amount: number;
  rewardPercent: number;
  status: RewardStatus;
  referralType: ReferralType;
  createdAt: string;
  updatedAt: string;
  referrer: { id: string; name: string | null; email: string | null; referralCode: string; role?: { name: string } };
  referee:  { id: string; name: string | null; email: string | null };
  booking:  {
    id: string;
    totalAmount: number;
    discountAmount: number;
    date: string;
    createdAt: string;
    homeCollection: boolean;
    package: { title: string };
  } | null;
}

const STATUS_CONFIG: Record<RewardStatus, { label: string; icon: typeof Clock; classes: string }> = {
  PENDING:   { label: "Pending",   icon: Clock,       classes: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Confirmed", icon: CheckCircle, classes: "bg-blue-100 text-blue-800"     },
  PAID:      { label: "Paid",      icon: CheckCircle, classes: "bg-green-100 text-green-800"   },
  CANCELLED: { label: "Cancelled", icon: XCircle,     classes: "bg-red-100 text-red-800"       },
};

const TYPE_CONFIG: Record<ReferralType, { label: string; icon: typeof Users; classes: string }> = {
  USER:  { label: "User",  icon: Users,       classes: "bg-blue-50 text-blue-700 border-blue-100"       },
  ADMIN: { label: "Admin", icon: Shield,      classes: "bg-orange-50 text-orange-700 border-orange-100" },
  AGENT: { label: "Agent", icon: UserSquare2, classes: "bg-purple-50 text-purple-700 border-purple-100" },
};

type FilterStatus = RewardStatus | "ALL";
type FilterType   = ReferralType | "ALL_TYPES";
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-sm text-gray-900 text-right">{value}</span>
    </div>
  );
}

function RewardModal({
  reward,
  onClose,
  onStatusChange,
  updating,
}: {
  reward: Reward;
  onClose: () => void;
  onStatusChange: (id: string, status: RewardStatus) => void;
  updating: boolean;
}) {
  useScrollLock();
  const scfg = STATUS_CONFIG[reward.status];
  const tcfg = TYPE_CONFIG[reward.referralType ?? "USER"];
  const SIcon = scfg.icon;
  const TIcon = tcfg.icon;
  const netAmount = reward.booking ? reward.booking.totalAmount - reward.booking.discountAmount : 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Referral Details</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{reward.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Status + Type badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${scfg.classes}`}>
              <SIcon className="w-3.5 h-3.5" />
              {scfg.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${tcfg.classes}`}>
              <TIcon className="w-3.5 h-3.5" />
              {tcfg.label} Referral
            </span>
          </div>

          {/* Referrer */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Referrer</p>
            <div className="bg-gray-50 rounded-xl px-4 py-1">
              <DetailRow label="Name"          value={reward.referrer.name ?? "—"} />
              <DetailRow label="Email"         value={reward.referrer.email ?? "—"} />
              <DetailRow label="Referral Code" value={<span className="font-mono font-bold text-primary">{reward.referrer.referralCode}</span>} />
              {reward.referrer.role && <DetailRow label="Role" value={reward.referrer.role.name} />}
            </div>
          </div>

          {/* Referee */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Referee (Patient)</p>
            <div className="bg-gray-50 rounded-xl px-4 py-1">
              <DetailRow label="Name"  value={reward.referee.name ?? "—"} />
              <DetailRow label="Email" value={reward.referee.email ?? "—"} />
            </div>
          </div>

          {/* Booking */}
          {reward.booking && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Booking</p>
              <div className="bg-gray-50 rounded-xl px-4 py-1">
                <DetailRow label="Package"         value={reward.booking.package.title} />
                <DetailRow label="Booking Date"    value={fmtDate(reward.booking.date)} />
                <DetailRow label="Home Collection" value={reward.booking.homeCollection ? "Yes" : "No"} />
                <DetailRow label="Gross Amount"    value={fmt(reward.booking.totalAmount)} />
                {reward.booking.discountAmount > 0 && (
                  <DetailRow label="Discount" value={<span className="text-red-500">− {fmt(reward.booking.discountAmount)}</span>} />
                )}
                <DetailRow label="Net Paid" value={<span className="font-semibold">{fmt(netAmount)}</span>} />
              </div>
            </div>
          )}

          {/* Reward */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reward</p>
            <div className="bg-gray-50 rounded-xl px-4 py-1">
              {reward.rewardPercent > 0 && (
                <DetailRow label="Rate"    value={`${reward.rewardPercent}% of net paid`} />
              )}
              <DetailRow label="Amount"  value={<span className="text-lg font-bold text-gray-900">{fmt(reward.amount)}</span>} />
              <DetailRow label="Created" value={fmtDateTime(reward.createdAt)} />
              <DetailRow label="Updated" value={fmtDateTime(reward.updatedAt)} />
            </div>
          </div>

          {/* Actions — Cancel / Restore only (payment handled via withdrawal) */}
          {(reward.status === "PENDING" || reward.status === "CANCELLED") && (
            <div className="pt-1">
              {reward.status === "PENDING" && (
                <button
                  disabled={updating}
                  onClick={() => onStatusChange(reward.id, "CANCELLED")}
                  className="w-full py-2.5 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Cancel Reward
                </button>
              )}
              {reward.status === "CANCELLED" && (
                <button
                  disabled={updating}
                  onClick={() => onStatusChange(reward.id, "PENDING")}
                  className="w-full py-2.5 bg-yellow-50 text-yellow-700 text-sm font-bold rounded-xl hover:bg-yellow-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                  Restore to Pending
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReferralsTable({ rewards: initial }: { rewards: Reward[] }) {
  const toast = useToast();
  const [rewards, setRewards]           = useState<Reward[]>(initial);
  const [updating, setUpdating]         = useState<string | null>(null);
  const [selected, setSelected]         = useState<Reward | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [filterType, setFilterType]     = useState<FilterType>("ALL_TYPES");
  const [dateRange, setDateRange]       = useState<DateRange>({ from: "", to: "" });

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
        setSelected((prev) => prev?.id === id ? { ...prev, status } : prev);
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
    const dateMatch   = inRange(r.createdAt, dateRange.from, dateRange.to);
    return statusMatch && typeMatch && dateMatch;
  });

  const countByStatus = (s: RewardStatus) => rewards.filter((r) => r.status === s).length;
  const countByType   = (t: ReferralType)  => rewards.filter((r) => r.referralType === t).length;

  const { page, setPage, totalPages, paged, totalItems, pageSize, setPageSize } = usePagination(filtered, 20);

  return (
    <>
      {selected && (
        <RewardModal
          reward={selected}
          onClose={() => setSelected(null)}
          onStatusChange={updateStatus}
          updating={updating === selected.id}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 space-y-2">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-semibold text-gray-400 mr-1">Status:</span>
            {(["ALL", "PENDING", "CONFIRMED", "PAID", "CANCELLED"] as const).map((s) => (
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
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <DateRangeFilter value={dateRange} onChange={(r) => { setDateRange(r); setPage(1); }} />
            <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No referral rewards match the selected filters.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3">Referrer</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Referee</th>
                <th className="px-5 py-3">Package</th>
                <th className="px-5 py-3">Reward</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.map((reward) => {
                const scfg = STATUS_CONFIG[reward.status];
                const tcfg = TYPE_CONFIG[reward.referralType ?? "USER"];
                const SIcon = scfg.icon;
                const TIcon = tcfg.icon;
                return (
                  <tr
                    key={reward.id}
                    onClick={() => setSelected(reward)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900 text-sm">{reward.referrer.name ?? "—"}</p>
                      <p className="text-xs text-primary font-mono">{reward.referrer.referralCode}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${tcfg.classes}`}>
                        <TIcon className="w-3 h-3" />
                        {tcfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900 text-sm">{reward.referee.name ?? "—"}</p>
                      <p className="text-xs text-gray-400">{reward.referee.email}</p>
                    </td>
                    <td className="px-5 py-3.5 max-w-[160px]">
                      <p className="text-gray-700 truncate text-sm">{reward.booking?.package.title ?? "—"}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-gray-900">{fmt(reward.amount)}</p>
                      {reward.rewardPercent > 0 && (
                        <p className="text-xs text-blue-500">{reward.rewardPercent}% of net</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(reward.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${scfg.classes}`}>
                        <SIcon className="w-3 h-3" />
                        {scfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {filtered.length > 0 && (
          <div className="px-5 pb-4 pt-2">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
          </div>
        )}
      </div>
    </>
  );
}
