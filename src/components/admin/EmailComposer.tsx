"use client";

import { useState, useEffect, useRef } from "react";
import {
  Send, RefreshCw, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Mail,
  Clock, Loader2, Users, CheckCheck,
} from "lucide-react";
import RichTextEditor from "@/components/ui/RichTextEditor";

interface EmailJob {
  id: string;
  status: string;
  subject: string;
  recipientType: string;
  totalRecipients: number;
  sent: number;
  failed: number;
  errorMessage: string | null;
  createdAt: string;
  actor: { name: string | null; email: string | null };
}

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
  const [recipientType, setRecipientType] = useState<"all" | "users" | "agents" | "admins" | "specific">("all");
  const [specificEmails, setSpecificEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [showJobs, setShowJobs] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Reminder trigger
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderResult, setReminderResult] = useState<string | null>(null);

  useEffect(() => { fetchJobs(); }, []);

  // Poll active jobs every 5s until all are settled
  useEffect(() => {
    const hasActive = jobs.some((j) => j.status === "QUEUED" || j.status === "PROCESSING");
    if (hasActive && !pollRef.current) {
      pollRef.current = setInterval(fetchJobs, 5_000);
    } else if (!hasActive && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [jobs]);

  useEffect(() => {
    if (showLogs) fetchLogs();
  }, [showLogs]);

  async function fetchJobs() {
    try {
      const res = await fetch("/api/admin/email/jobs");
      if (res.ok) setJobs(await res.json());
    } catch {}
  }

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
    setSending(true);

    const emails = specificEmails
      .split(/[\n,]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, htmlContent, recipientType, specificEmails: emails }),
      });

      if (!res.ok) throw new Error(await res.text());
      // 202 — job queued; refresh job list immediately
      setSubject("");
      setHtmlContent("");
      setSpecificEmails("");
      await fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to queue email job.");
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

          {/* Recipients */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Recipients</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "all",      label: "Everyone" },
                { value: "users",    label: "Users" },
                { value: "agents",   label: "Agents" },
                { value: "admins",   label: "Admins" },
                { value: "specific", label: "Specific Emails" },
              ] as const).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRecipientType(value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    recipientType === value
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"
                  }`}
                >
                  {label}
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
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message Body</label>
            <RichTextEditor
              value={htmlContent}
              onChange={setHtmlContent}
              placeholder="Dear valued customer, …"
              minHeight={280}
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

      {/* ── Broadcast jobs ── */}
      {jobs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowJobs((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Broadcast Queue</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {jobs.filter((j) => j.status === "QUEUED" || j.status === "PROCESSING").length > 0
                    ? "Sending in progress…"
                    : `${jobs.length} job${jobs.length !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
            {showJobs ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showJobs && (
            <div className="border-t border-gray-100 divide-y divide-gray-50">
              {jobs.map((job) => {
                const progress = job.totalRecipients > 0
                  ? Math.round(((job.sent + job.failed) / job.totalRecipients) * 100)
                  : 0;
                const isActive = job.status === "QUEUED" || job.status === "PROCESSING";
                return (
                  <div key={job.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{job.subject}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(job.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                          {" · "}{job.recipientType}
                        </p>
                      </div>
                      <span className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        job.status === "COMPLETED" ? "bg-green-50 text-green-700" :
                        job.status === "FAILED"    ? "bg-red-50 text-red-600" :
                        job.status === "PROCESSING"? "bg-blue-50 text-blue-600" :
                                                     "bg-yellow-50 text-yellow-700"
                      }`}>
                        {job.status === "PROCESSING" && <Loader2 className="w-3 h-3 animate-spin" />}
                        {job.status === "COMPLETED"  && <CheckCheck className="w-3 h-3" />}
                        {job.status === "QUEUED"     && <Clock className="w-3 h-3" />}
                        {job.status}
                      </span>
                    </div>

                    {job.totalRecipients > 0 && (
                      <>
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{job.totalRecipients} recipients</span>
                          <span>{job.sent} sent · {job.failed} failed</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${job.failed > 0 && !isActive ? "bg-red-400" : "bg-primary"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </>
                    )}
                    {job.errorMessage && (
                      <p className="mt-1.5 text-xs text-red-500">{job.errorMessage}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Manual reminder trigger */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
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
