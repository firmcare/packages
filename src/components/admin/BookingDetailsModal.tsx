"use client";
import { useScrollLock } from "@/hooks/useScrollLock";

import { useRef, useState, useEffect } from "react";
import {
  X, Save, Upload, FileText, Loader2, CheckCircle,
  Clock, CircleCheck, FlaskConical, Microscope, FileCheck,
  CircleX, ChevronRight, Lock, Activity,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

interface Booking {
  id: string;
  date: Date;
  status: string;
  totalAmount: any;
  homeCollection: boolean;
  resultPdfUrl: string | null;
  notes: string | null;
  paymentRef: string | null;
  referralCode: string | null;
  user: { name: string | null; email: string | null; phone: string | null };
  package: { title: string };
  referralRewards?: Array<{
    referrer: { name: string | null; referralCode: string };
  }>;
}

interface BookingDetailsModalProps {
  booking: Booking;
  onClose: () => void;
}

// ── Status metadata ────────────────────────────────────────────────────────────
const STATUS_META: Record<string, {
  label: string;
  description: string;
  icon: React.ReactNode;
  badge: string; // tailwind classes for the badge
}> = {
  PENDING:          { label: "Pending",          icon: <Clock className="w-4 h-4" />,        description: "Booking created, awaiting confirmation",       badge: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  CONFIRMED:        { label: "Confirmed",         icon: <CircleCheck className="w-4 h-4" />,  description: "Payment verified, appointment scheduled",       badge: "bg-blue-100 text-blue-800 border-blue-200"       },
  SAMPLE_COLLECTED: { label: "Sample Collected",  icon: <FlaskConical className="w-4 h-4" />, description: "Sample collected from patient",                 badge: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  IN_PROGRESS:      { label: "In Progress",       icon: <Microscope className="w-4 h-4" />,   description: "Sample being analyzed in the lab",              badge: "bg-purple-100 text-purple-800 border-purple-200" },
  RESULTS_READY:    { label: "Results Ready",     icon: <FileCheck className="w-4 h-4" />,    description: "Upload the result PDF to activate this status", badge: "bg-teal-100 text-teal-800 border-teal-200"       },
  COMPLETED:        { label: "Completed",         icon: <CheckCircle className="w-4 h-4" />,  description: "All done — patient has been informed",          badge: "bg-green-100 text-green-800 border-green-200"    },
  CANCELLED:        { label: "Cancelled",         icon: <CircleX className="w-4 h-4" />,      description: "Booking has been cancelled",                    badge: "bg-red-100 text-red-800 border-red-200"          },
};

// Linear pipeline order (excluding CANCELLED which is a side-exit)
const PIPELINE = ["PENDING", "CONFIRMED", "SAMPLE_COLLECTED", "IN_PROGRESS", "RESULTS_READY", "COMPLETED"];

// Allowed transitions from each status.
// CANCELLED is only permitted before any physical action (sample collection) has occurred.
const TRANSITIONS: Record<string, string[]> = {
  PENDING:          ["CONFIRMED", "CANCELLED"],
  CONFIRMED:        ["SAMPLE_COLLECTED", "CANCELLED"],
  SAMPLE_COLLECTED: ["IN_PROGRESS"],   // sample taken — cannot cancel
  IN_PROGRESS:      ["RESULTS_READY"], // lab work underway — cannot cancel
  RESULTS_READY:    ["COMPLETED"],     // results exist — cannot cancel
  COMPLETED:        [],                // terminal
  CANCELLED:        [],                // terminal
};

interface BookingLog {
  id: string;
  event: string;
  note: string;
  actorName: string;
  createdAt: string;
}

const EVENT_STYLES: Record<string, { dot: string; text: string }> = {
  PAYMENT_CONFIRMED: { dot: "bg-green-500",  text: "text-green-700" },
  STATUS_CHANGED:    { dot: "bg-blue-500",   text: "text-blue-700"  },
  PDF_UPLOADED:      { dot: "bg-teal-500",   text: "text-teal-700"  },
  NOTES_UPDATED:     { dot: "bg-gray-400",   text: "text-gray-600"  },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function BookingDetailsModal({ booking, onClose }: BookingDetailsModalProps) {
  useScrollLock();
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resultUploaded, setResultUploaded] = useState(!!booking.resultPdfUrl);
  const [logs, setLogs] = useState<BookingLog[]>([]);

  useEffect(() => {
    fetch(`/api/bookings/${booking.id}/logs`)
      .then((r) => r.ok ? r.json() : [])
      .then(setLogs)
      .catch(() => {});
  }, [booking.id]);

  const [formData, setFormData] = useState({
    status: booking.status,
    notes: booking.notes || "",
  });

  const allowed = TRANSITIONS[formData.status] ?? [];
  // isTerminal = the booking is ALREADY in a terminal state as saved on the server.
  // Do NOT derive this from formData.status or the Save button disappears when
  // transitioning TO a terminal state (e.g. clicking Completed hides the button).
  const isTerminal = (TRANSITIONS[booking.status] ?? []).length === 0;
  const pdfActive = formData.status === "RESULTS_READY";

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleStatusSelect = (next: string) => {
    if (!allowed.includes(next)) return;
    setFormData((f) => ({ ...f, status: next }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.type !== "application/pdf") {
      toast.error("Please select a PDF file.");
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error("PDF must be 5 MB or smaller.");
      return;
    }
    setSelectedFile(file);
    setUploadSuccess(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      const res = await fetch(`/api/bookings/${booking.id}/upload-result`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        toast.error(`Upload failed: ${await res.text()}`);
        return;
      }
      toast.success("Result PDF uploaded. Click Save Changes to notify the patient.");
      setUploadSuccess(true);
      setResultUploaded(true);
      setSelectedFile(null);
      setFormData((f) => ({ ...f, status: "RESULTS_READY" }));
      router.refresh();
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.status === booking.status && formData.notes === (booking.notes || "")) {
      onClose();
      return;
    }
    if (formData.status === "RESULTS_READY" && !resultUploaded) {
      toast.error("Upload the result PDF before setting status to Results Ready.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success("Booking updated successfully.");
        router.refresh();
        // Refresh logs before closing so the new entry is visible
        const updated = await fetch(`/api/bookings/${booking.id}/logs`).then((r) => r.ok ? r.json() : logs);
        setLogs(updated);
        onClose();
      } else {
        toast.error("Failed to update booking");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  // ── helpers ───────────────────────────────────────────────────────────────
  const currentMeta = STATUS_META[formData.status];
  const pipelineIndexCurrent = PIPELINE.indexOf(formData.status);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Manage Booking</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* ── Booking Info ── */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Booking Information</h3>
              {booking.paymentRef && (
                <span className="font-mono text-xs text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-lg">
                  {booking.paymentRef}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">User:</span>
                <p className="font-medium">{booking.user.name || "N/A"}</p>
                <p className="text-gray-500">{booking.user.email}</p>
                <p className="text-gray-500">{booking.user.phone}</p>
              </div>
              <div>
                <span className="text-gray-600">Package:</span>
                <p className="font-medium">{booking.package.title}</p>
                <p className="text-gray-500">₦{Number(booking.totalAmount).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <p className="font-medium">{new Date(booking.date).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-gray-600">Home Collection:</span>
                <p className="font-medium">{booking.homeCollection ? "Yes" : "No"}</p>
              </div>
              {booking.referralCode && (
                <div className="col-span-2 flex items-center gap-2 mt-1 p-2 bg-purple-50 rounded-lg border border-purple-100">
                  <span className="text-xs font-semibold text-purple-700">Referral code used:</span>
                  <span className="font-mono text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full tracking-wider">{booking.referralCode}</span>
                  {booking.referralRewards && booking.referralRewards.length > 0 && (
                    <span className="ml-auto text-xs text-purple-600">
                      by {booking.referralRewards[0].referrer.name ?? "Unknown"}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Status pipeline tracker ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>

            {/* Pipeline bar */}
            <div className="flex items-center gap-0 mb-4 overflow-x-auto pb-1">
              {PIPELINE.map((s, idx) => {
                const meta = STATUS_META[s];
                const isPast = idx < pipelineIndexCurrent;
                const isCurrent = s === formData.status;
                const isFuture = idx > pipelineIndexCurrent;
                const isNextValid = allowed.includes(s) && s !== "CANCELLED";

                return (
                  <div key={s} className="flex items-center shrink-0">
                    <button
                      type="button"
                      disabled={!isNextValid}
                      onClick={() => isNextValid && handleStatusSelect(s)}
                      title={isFuture && !isNextValid ? `Complete "${STATUS_META[PIPELINE[idx - 1]]?.label}" first` : meta.description}
                      className={[
                        "flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all text-center min-w-20",
                        isCurrent
                          ? "bg-primary/10 ring-2 ring-primary text-primary"
                          : isPast
                            ? "text-gray-400 cursor-default"
                            : isNextValid
                              ? "hover:bg-gray-100 text-gray-600 cursor-pointer"
                              : "text-gray-300 cursor-not-allowed opacity-50",
                      ].join(" ")}
                    >
                      <span className={isCurrent ? "text-primary" : isPast ? "text-gray-300" : ""}>
                        {meta.icon}
                      </span>
                      <span className="text-[10px] font-medium leading-tight">{meta.label}</span>
                      {isNextValid && (
                        <span className="text-[9px] text-primary font-semibold">← tap</span>
                      )}
                    </button>
                    {idx < PIPELINE.length - 1 && (
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isPast || isCurrent ? "text-gray-300" : "text-gray-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Current status badge + description */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${currentMeta.badge}`}>
              {currentMeta.icon}
              <span>{currentMeta.label}</span>
              <span className="font-normal text-current opacity-70">— {currentMeta.description}</span>
            </div>

            {/* Cancel button (shown unless terminal) */}
            {!isTerminal && formData.status !== "CANCELLED" && (
              <button
                type="button"
                onClick={() => handleStatusSelect("CANCELLED")}
                className={[
                  "mt-2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors",
                  formData.status === "CANCELLED"
                    ? "bg-red-50 border-red-300 text-red-700 font-semibold"
                    : "border-red-200 text-red-500 hover:bg-red-50",
                ].join(" ")}
              >
                <CircleX className="w-3.5 h-3.5" />
                Mark as Cancelled
              </button>
            )}

            {isTerminal && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                <Lock className="w-3 h-3" />
                This booking is {formData.status.toLowerCase()} — no further status changes allowed.
              </p>
            )}
          </div>

          {/* ── Result PDF — only active at RESULTS_READY ── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className={`block text-sm font-medium ${pdfActive ? "text-gray-700" : "text-gray-400"}`}>
                Result PDF
              </label>
              {!pdfActive && (
                <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" />
                  Available at &quot;Results Ready&quot;
                </span>
              )}
            </div>

            <div className={`border-2 border-dashed rounded-lg p-4 space-y-3 transition-colors ${pdfActive ? "border-gray-200" : "border-gray-100 bg-gray-50"}`}>
              {!pdfActive ? (
                <p className="text-sm text-gray-400 text-center py-2">
                  Set status to <strong>In Progress → Results Ready</strong> before uploading the result PDF.
                </p>
              ) : (
                <>
                  {resultUploaded && !selectedFile && (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>Result PDF uploaded{uploadSuccess ? " — save to notify patient" : ""}.</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      <FileText className="w-4 h-4 text-gray-500" />
                      {resultUploaded ? "Replace PDF" : "Choose PDF"}
                    </button>
                    {selectedFile && (
                      <span className="text-sm text-gray-600 truncate max-w-50">{selectedFile.name}</span>
                    )}
                  </div>

                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={uploading}
                      className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? "Uploading..." : "Upload Result"}
                    </button>
                  )}

                  <p className="text-xs text-gray-400">
                    PDF only · max 5 MB · patient notified when you Save Changes
                  </p>
                </>
              )}
            </div>
          </div>

          {/* ── Notes ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes <span className="font-normal text-gray-400">(visible to patient)</span>
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={isTerminal}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
              placeholder="Add any notes about this booking..."
            />
          </div>

          {/* ── Activity Log ── */}
          {logs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Activity Log</span>
              </div>
              <ol className="relative border-l border-gray-200 space-y-3 ml-2">
                {logs.map((log) => {
                  const style = EVENT_STYLES[log.event] ?? { dot: "bg-gray-400", text: "text-gray-600" };
                  return (
                    <li key={log.id} className="ml-4">
                      <span className={`absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full border-2 border-white ${style.dot}`} />
                      <p className={`text-sm font-medium ${style.text}`}>{log.note}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(log.createdAt).toLocaleString("en-NG", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            {formData.status === "RESULTS_READY" && !resultUploaded && (
              <p className="text-xs text-amber-600 flex items-center gap-1 mr-auto">
                <Lock className="w-3 h-3" />
                Upload the result PDF above to save this status.
              </p>
            )}
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Close
            </button>
            {!isTerminal && (
              <button
                type="submit"
                disabled={saving || (formData.status === "RESULTS_READY" && !resultUploaded)}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
