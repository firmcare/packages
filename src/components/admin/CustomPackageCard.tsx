"use client";

import { useState } from "react";
import Link from "next/link";
import { Layers, BookOpen, TrendingUp, TestTube, ExternalLink, Ban, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { fmtNgn } from "@/lib/format";

interface Props {
  pkg: {
    id: string;
    isActive: boolean;
  };
  stats: {
    totalBookings: number;
    totalRevenue: number;
    recentBookings: {
      id: string;
      createdAt: string;
      totalAmount: number;
      status: string;
      notes: string | null;
      user: { name: string | null; email: string };
    }[];
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:          "bg-yellow-100 text-yellow-700",
  CONFIRMED:        "bg-blue-100 text-blue-700",
  SAMPLE_COLLECTED: "bg-purple-100 text-purple-700",
  IN_PROGRESS:      "bg-indigo-100 text-indigo-700",
  RESULTS_READY:    "bg-teal-100 text-teal-700",
  COMPLETED:        "bg-green-100 text-green-700",
  CANCELLED:        "bg-red-100 text-red-700",
};

export default function CustomPackageCard({ pkg, stats }: Props) {
  const toast = useToast();
  const [isActive, setIsActive] = useState(pkg.isActive);
  const [toggling, setToggling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fmt = fmtNgn;
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

  const handleToggle = async () => {
    setToggling(true);
    try {
      const res = await fetch(`/api/packages/${pkg.id}/toggle`, { method: "PATCH" });
      if (res.ok) {
        setIsActive((v) => !v);
        toast.success(`Custom package ${isActive ? "disabled" : "enabled"}.`);
      } else {
        toast.error("Failed to update package status.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setToggling(false);
    }
  };

  // Parse selected tests from booking notes ("Selected tests: A, B, C")
  const parseTests = (notes: string | null) => {
    if (!notes) return [];
    const match = notes.match(/Selected tests?:\s*(.+)/i);
    return match ? match[1].split(",").map((s) => s.trim()).filter(Boolean) : [];
  };

  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-purple-50/60 to-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900">Custom Tailored Package</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Dynamic
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {isActive ? "Active" : "Disabled"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Users build their own package by selecting individual tests at checkout. Price is calculated dynamically.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/tests"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <TestTube className="w-3.5 h-3.5" />
            Manage Tests
          </Link>
          <Link
            href="/custom-package"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Preview
          </Link>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={toggling}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${
              isActive
                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
            }`}
          >
            {toggling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isActive ? (
              <Ban className="w-3.5 h-3.5" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5" />
            )}
            {isActive ? "Disable" : "Enable"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 px-6 py-4 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <BookOpen className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
            <p className="text-xs text-gray-400 font-medium">Total Bookings</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4.5 h-4.5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{fmt(stats.totalRevenue)}</p>
            <p className="text-xs text-gray-400 font-medium">Total Revenue</p>
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Custom Bookings</p>
          <Link
            href={`/admin/bookings?packageId=${pkg.id}`}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {stats.recentBookings.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-4 text-center">No custom bookings yet.</p>
        ) : (
          <div className="space-y-2">
            {stats.recentBookings.map((b) => {
              const tests = parseTests(b.notes);
              return (
                <div
                  key={b.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-primary/20 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {b.user.name ?? b.user.email}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[b.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {b.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    {tests.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {tests.slice(0, 4).join(" · ")}{tests.length > 4 ? ` +${tests.length - 4} more` : ""}
                      </p>
                    )}
                    <p className="text-xs text-gray-300 mt-0.5">{fmtDate(b.createdAt)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-gray-900">{fmt(b.totalAmount)}</p>
                    <Link
                      href={`/admin/bookings?id=${b.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={isActive ? "Disable custom package?" : "Enable custom package?"}
        description={
          isActive
            ? "Users will no longer be able to build and book custom packages."
            : "Users will be able to build and book custom packages again."
        }
        confirmLabel={isActive ? "Yes, Disable" : "Yes, Enable"}
        variant={isActive ? "danger" : "warning"}
        onConfirm={() => { setConfirmOpen(false); handleToggle(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
