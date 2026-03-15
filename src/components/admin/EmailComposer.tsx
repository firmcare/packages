"use client";

import { useState, useEffect } from "react";
import {
  Send, RefreshCw, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Mail,
} from "lucide-react";

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  type: string;
  status: string;
  error: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  verification: "Verification",
  welcome: "Welcome",
  booking_confirmed: "Booking Confirmed",
  booking_reminder: "Booking Reminder",
  general: "General",
};

export default function EmailComposer() {
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [recipientType, setRecipientType] = useState<"all" | "verified" | "specific">("all");
  const [specificEmails, setSpecificEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Reminder trigger
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderResult, setReminderResult] = useState<string | null>(null);

  useEffect(() => {
    if (showLogs) fetchLogs();
  }, [showLogs]);

  async function fetchLogs() {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/admin/email");
      const data = await res.json();
      setLogs(data.logs ?? []);
      setLogsTotal(data.total ?? 0);
    } finally {
      setLogsLoading(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSending(true);

    const emails = specificEmails
      .split(/[\n,]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          htmlContent,
          recipientType,
          specificEmails: emails,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
      setSubject("");
      setHtmlContent("");
      setSpecificEmails("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send emails.");
    } finally {
      setSending(false);
    }
  }

  async function handleTriggerReminders() {
    setReminderResult(null);
    setReminderLoading(true);
    try {
      const res = await fetch("/api/admin/reminders", { method: "POST" });
      const data = await res.json();
      if (data.skipped) {
        setReminderResult("Reminders are disabled. Enable them in Settings.");
      } else {
        setReminderResult(`Done — ${data.sent} reminder(s) sent, ${data.failed} failed.`);
      }
    } catch {
      setReminderResult("Failed to trigger reminders.");
    } finally {
      setReminderLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Compose email */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Compose Broadcast Email</h3>
            <p className="text-xs text-gray-400 mt-0.5">Send a message to all or selected users</p>
          </div>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          {result && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Sent {result.sent} / {result.total} emails.
              {result.failed > 0 && ` (${result.failed} failed)`}
            </div>
          )}

          {/* Recipients */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Recipients</label>
            <div className="flex flex-wrap gap-2">
              {(["all", "verified", "specific"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setRecipientType(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    recipientType === t
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"
                  }`}
                >
                  {t === "all" ? "All Users" : t === "verified" ? "Verified Users" : "Specific Emails"}
                </button>
              ))}
            </div>
          </div>

          {recipientType === "specific" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Addresses
              </label>
              <textarea
                required
                rows={3}
                placeholder="Enter emails separated by commas or new lines"
                value={specificEmails}
                onChange={(e) => setSpecificEmails(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
            <input
              required
              type="text"
              placeholder="Email subject line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Message Body
              <span className="ml-2 font-normal text-gray-400 text-xs">(HTML supported)</span>
            </label>
            <textarea
              required
              rows={8}
              placeholder="<p>Dear valued customer,</p><p>...</p>"
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
            />
            <p className="text-xs text-gray-400 mt-1">
              Your message will be wrapped in the FirmCare branded email template automatically.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? "Sending…" : "Send Email"}
            </button>
          </div>
        </form>
      </div>

      {/* Manual reminder trigger */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Booking Reminders</h3>
            <p className="text-xs text-gray-400 mt-1">
              Manually trigger reminder emails for upcoming bookings. Configure reminder timing in Settings.
            </p>
            {reminderResult && (
              <p className="mt-2 text-sm text-gray-600">{reminderResult}</p>
            )}
          </div>
          <button
            onClick={handleTriggerReminders}
            disabled={reminderLoading}
            className="shrink-0 flex items-center gap-2 px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${reminderLoading ? "animate-spin" : ""}`} />
            {reminderLoading ? "Running…" : "Trigger Now"}
          </button>
        </div>
      </div>

      {/* Email logs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Email Logs</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {logsTotal > 0 ? `${logsTotal} total emails sent` : "Delivery history"}
              </p>
            </div>
          </div>
          {showLogs ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showLogs && (
          <div className="border-t border-gray-100">
            {logsLoading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading logs…</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No emails sent yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left font-semibold">To</th>
                      <th className="px-4 py-3 text-left font-semibold">Subject</th>
                      <th className="px-4 py-3 text-left font-semibold">Type</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate">{log.to}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{log.subject}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                            {TYPE_LABELS[log.type] ?? log.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              log.status === "sent"
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("en-NG", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
