"use client";

import { useState } from "react";
import {
  Settings, Globe, Mail, Calendar,
  Gift, Clock, CreditCard, CheckCircle, AlertCircle, Save, Bell, Trash2, Loader2,
} from "lucide-react";

interface Props {
  initialSettings: Record<string, string>;
}

interface FieldConfig {
  key: string;
  label: string;
  type?: "text" | "number" | "email" | "url" | "time" | "textarea";
  placeholder?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
}

interface Section {
  title: string;
  description: string;
  icon: typeof Settings;
  fields: FieldConfig[];
}

const SECTIONS: Section[] = [
  {
    title: "General",
    description: "Business name, URL, and contact details",
    icon: Globe,
    fields: [
      { key: "site_name",     label: "Site / Business Name", placeholder: "FirmCare Diagnostics" },
      { key: "site_url",      label: "Site URL",             type: "url", placeholder: "https://firmcare.com.ng" },
      { key: "contact_email", label: "Contact Email",        type: "email", placeholder: "info@firmcare.com.ng" },
      { key: "contact_phone", label: "Contact Phone",        placeholder: "+234-808-874-3272" },
    ],
  },
  {
    title: "Booking",
    description: "Home collection fee and booking lead-time",
    icon: Calendar,
    fields: [
      {
        key: "home_collection_fee",
        label: "Home Collection Fee (NGN)",
        type: "number",
        prefix: "₦",
        placeholder: "15000",
        hint: "Fee added when a patient requests home sample collection.",
      },
      {
        key: "booking_advance_days",
        label: "Minimum Booking Lead Time",
        type: "number",
        suffix: "days",
        placeholder: "1",
        hint: "How many days ahead a booking date must be.",
      },
    ],
  },
  {
    title: "Referrals",
    description: "Reward percentages per referral type — applied to booking value",
    icon: Gift,
    fields: [
      {
        key: "referral_reward_percent_user",
        label: "User Referral Reward",
        type: "number",
        suffix: "%",
        placeholder: "5",
        hint: "Reward % for regular users who refer new customers.",
      },
      {
        key: "referral_reward_percent_admin",
        label: "Admin Referral Reward",
        type: "number",
        suffix: "%",
        placeholder: "3",
        hint: "Reward % when an admin's referral code is used.",
      },
      {
        key: "referral_reward_percent_agent",
        label: "Agent (Marketing Officer) Referral Reward",
        type: "number",
        suffix: "%",
        placeholder: "10",
        hint: "Reward % for marketing agents — typically higher than regular users.",
      },
    ],
  },
  {
    title: "Payment",
    description: "Paystack configuration (secret key is managed via environment variables)",
    icon: CreditCard,
    fields: [
      {
        key: "paystack_public_key_display",
        label: "Paystack Public Key",
        placeholder: "Set via NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY in .env",
        hint: "Read from environment variable — edit .env to change.",
      },
    ],
  },
  {
    title: "Email (SMTP)",
    description: "Outgoing email configuration for notifications and verification emails",
    icon: Mail,
    fields: [
      {
        key: "smtp_host",
        label: "SMTP Host",
        placeholder: "smtp.gmail.com",
        hint: "e.g. smtp.gmail.com, smtp.sendgrid.net, or your custom SMTP host.",
      },
      {
        key: "smtp_port",
        label: "SMTP Port",
        type: "number" as const,
        placeholder: "587",
        hint: "Use 587 (STARTTLS) or 465 (SSL). Gmail typically uses 587.",
      },
      {
        key: "smtp_user",
        label: "SMTP Username",
        type: "email" as const,
        placeholder: "noreply@firmcare.com.ng",
        hint: "The email address used to authenticate with the SMTP server.",
      },
      {
        key: "smtp_from_name",
        label: "From Name",
        placeholder: "FirmCare Diagnostics",
        hint: "The display name shown in the From field of outgoing emails.",
      },
      {
        key: "smtp_from_email",
        label: "From Email Address",
        type: "email" as const,
        placeholder: "noreply@firmcare.com.ng",
        hint: "Leave blank to use the SMTP username as the sender address.",
      },
    ],
  },
];

// ── Business Hours ──────────────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
type Day = typeof DAYS[number];

interface DaySchedule {
  enabled: boolean;
  open: string;
  close: string;
}

type WeekSchedule = Record<Day, DaySchedule>;

const DEFAULT_SCHEDULE: WeekSchedule = {
  Monday:    { enabled: true,  open: "08:00", close: "17:00" },
  Tuesday:   { enabled: true,  open: "08:00", close: "17:00" },
  Wednesday: { enabled: true,  open: "08:00", close: "17:00" },
  Thursday:  { enabled: true,  open: "08:00", close: "17:00" },
  Friday:    { enabled: true,  open: "08:00", close: "17:00" },
  Saturday:  { enabled: true,  open: "09:00", close: "14:00" },
  Sunday:    { enabled: false, open: "09:00", close: "12:00" },
};

function parseSchedule(raw: string | undefined): WeekSchedule {
  if (!raw) return DEFAULT_SCHEDULE;
  try {
    const parsed = JSON.parse(raw);
    // Merge with defaults in case new days are added later
    return Object.fromEntries(
      DAYS.map((d) => [d, { ...DEFAULT_SCHEDULE[d], ...(parsed[d] ?? {}) }])
    ) as WeekSchedule;
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

function BusinessHoursSection({ initialRaw }: { initialRaw: string | undefined }) {
  const [schedule, setSchedule] = useState<WeekSchedule>(() => parseSchedule(initialRaw));
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const update = (day: Day, field: keyof DaySchedule, value: string | boolean) =>
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_hours_schedule: JSON.stringify(schedule) }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save business hours.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Business Hours</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Set opening and closing times per day. Toggle off days that are closed.
          </p>
        </div>
      </div>

      {/* Day rows */}
      <div className="p-6 space-y-1">
        {/* Column headers */}
        <div className="grid grid-cols-[100px_44px_1fr_1fr] sm:grid-cols-[130px_44px_1fr_1fr] gap-3 mb-2 px-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Day</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Open</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Opens At</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Closes At</span>
        </div>

        {DAYS.map((day) => {
          const d = schedule[day];
          return (
            <div
              key={day}
              className={`grid grid-cols-[100px_44px_1fr_1fr] sm:grid-cols-[130px_44px_1fr_1fr] gap-3 items-center py-2 px-1 rounded-xl transition-colors ${
                d.enabled ? "bg-white" : "bg-gray-50"
              }`}
            >
              {/* Day name */}
              <span className={`text-sm font-semibold truncate ${d.enabled ? "text-gray-900" : "text-gray-400"}`}>
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.slice(0, 3)}</span>
              </span>

              {/* Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={d.enabled}
                onClick={() => update(day, "enabled", !d.enabled)}
                className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                  d.enabled ? "bg-primary" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    d.enabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>

              {/* Opens At */}
              <input
                type="time"
                value={d.open}
                disabled={!d.enabled}
                onChange={(e) => update(day, "open", e.target.value)}
                className="h-9 px-3 border border-gray-200 rounded-xl text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed w-full"
              />

              {/* Closes At */}
              <input
                type="time"
                value={d.close}
                disabled={!d.enabled}
                onChange={(e) => update(day, "close", e.target.value)}
                className="h-9 px-3 border border-gray-200 rounded-xl text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed w-full"
              />
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/40">
        {error ? (
          <span className="flex items-center gap-1.5 text-red-600 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" /> {error}
          </span>
        ) : saved ? (
          <span className="flex items-center gap-1.5 text-green-600 text-sm font-semibold">
            <CheckCircle className="w-4 h-4" /> Saved successfully
          </span>
        ) : (
          <span className="text-xs text-gray-400">Changes apply immediately after saving.</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── Notification Settings ────────────────────────────────────────────────────

const NOTIFY_TOGGLES = [
  { key: "notify_on_booking_confirmed",  label: "Payment Confirmed",       hint: "Patient notified when payment is verified by Paystack"   },
  { key: "notify_on_sample_collected",   label: "Sample Collected",        hint: "Patient notified when their sample is collected"          },
  { key: "notify_on_in_progress",        label: "Test In Progress",        hint: "Patient notified when lab analysis begins"                },
  { key: "notify_on_results_ready",      label: "Results Ready",           hint: "Patient notified when results PDF is available"           },
  { key: "notify_on_completed",          label: "Booking Completed",       hint: "Patient notified when booking is marked complete"         },
  { key: "notify_on_cancelled",          label: "Booking Cancelled",       hint: "Patient notified when booking is cancelled"               },
  { key: "notify_admin_new_booking",     label: "Admin: New Booking Alert",hint: "Admins notified whenever a new booking is placed"         },
] as const;

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${enabled ? "bg-primary" : "bg-gray-200"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function NotificationSettingsSection({ initialSettings }: { initialSettings: Record<string, string> }) {
  const bool = (key: string) => initialSettings[key] !== "false";
  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIFY_TOGGLES.map(({ key }) => [key, bool(key)]))
  );
  const [remindersEnabled, setRemindersEnabled] = useState(() => initialSettings["reminders_enabled"] !== "false");
  const [reminderDays, setReminderDays] = useState(initialSettings["reminder_days_before"] ?? "1,3");
  const [retentionDays, setRetentionDays] = useState(initialSettings["notification_retention_days"] ?? "30");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updates: Record<string, string> = {
        reminders_enabled: remindersEnabled ? "true" : "false",
        reminder_days_before: reminderDays,
        notification_retention_days: retentionDays,
        ...Object.fromEntries(Object.entries(toggles).map(([k, v]) => [k, v ? "true" : "false"])),
      };
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save notification settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleCleanup = async () => {
    setCleaning(true);
    setCleanResult(null);
    try {
      const res = await fetch("/api/admin/notifications/cleanup", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCleanResult(`Deleted ${data.deleted} notification${data.deleted !== 1 ? "s" : ""} older than ${data.retentionDays} days.`);
    } catch {
      setCleanResult("Cleanup failed. Please try again.");
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
          <p className="text-xs text-gray-400 mt-0.5">Control which notifications are sent and how long they are kept</p>
        </div>
      </div>

      <div className="p-6 space-y-8">

        {/* Email Reminders */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Email Reminders</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Appointment Reminders</p>
                <p className="text-xs text-gray-400 mt-0.5">Send automatic reminder emails before upcoming appointments</p>
              </div>
              <Toggle enabled={remindersEnabled} onToggle={() => setRemindersEnabled((v) => !v)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Days Before Appointment</label>
              <input
                type="text"
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
                placeholder="1,3"
                disabled={!remindersEnabled}
                className="h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:bg-gray-50 disabled:text-gray-400 w-48"
              />
              <p className="text-xs text-gray-400 mt-1.5">Comma-separated. e.g. "1,3" sends reminders 1 and 3 days before.</p>
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* In-App Notification Toggles */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">In-App Notifications</p>
          <div className="space-y-3">
            {NOTIFY_TOGGLES.map(({ key, label, hint }) => (
              <div key={key} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
                </div>
                <Toggle
                  enabled={toggles[key]}
                  onToggle={() => setToggles((t) => ({ ...t, [key]: !t[key] }))}
                />
              </div>
            ))}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Retention Policy */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Retention Policy</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Auto-Delete After</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="7"
                  max="365"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(e.target.value)}
                  className="h-10 w-24 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
                <span className="text-sm text-gray-500">days</span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Notifications older than this are deleted automatically during the nightly cron run.</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleCleanup}
                disabled={cleaning}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {cleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {cleaning ? "Cleaning…" : "Clean Up Now"}
              </button>
              {cleanResult && (
                <p className="text-sm text-gray-600">{cleanResult}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/40">
        {error ? (
          <span className="flex items-center gap-1.5 text-red-600 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" /> {error}
          </span>
        ) : saved ? (
          <span className="flex items-center gap-1.5 text-green-600 text-sm font-semibold">
            <CheckCircle className="w-4 h-4" /> Saved successfully
          </span>
        ) : (
          <span className="text-xs text-gray-400">Changes apply immediately after saving.</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── Main form ───────────────────────────────────────────────────────────────

export default function SettingsForm({ initialSettings }: Props) {
  const [values, setValues]     = useState<Record<string, string>>(initialSettings);
  const [saving, setSaving]     = useState<string | null>(null); // section title being saved
  const [saved, setSaved]       = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const handleSave = async (section: Section) => {
    setSaving(section.title);
    setError(null);
    setSaved(null);

    const updates: Record<string, string> = {};
    for (const f of section.fields) {
      if (f.key === "paystack_public_key_display") continue;
      updates[f.key] = values[f.key] ?? "";
    }

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(section.title);
      setTimeout(() => setSaved(null), 3000);
    } catch {
      setError(`Failed to save ${section.title} settings.`);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {SECTIONS.slice(0, 3).map((section) => {
        const Icon = section.icon;
        const isSaving = saving === section.title;
        const isSaved  = saved  === section.title;

        return (
          <div key={section.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{section.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
              </div>
            </div>

            {/* Fields */}
            <div className="p-6 space-y-5">
              {section.fields.map((field) => {
                const isReadonly = field.key === "paystack_public_key_display";
                return (
                  <div key={field.key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {field.label}
                    </label>
                    <div className="flex items-center gap-0">
                      {field.prefix && (
                        <span className="px-3 h-10 flex items-center bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-500 font-medium">
                          {field.prefix}
                        </span>
                      )}
                      <input
                        type="text"
                        inputMode={field.type === "number" ? "numeric" : field.type === "email" ? "email" : "text"}
                        value={
                          isReadonly
                            ? (typeof window !== "undefined"
                                ? (process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "Not configured")
                                : "Set via environment variable")
                            : field.type === "number" && field.prefix === "₦"
                            ? Number(values[field.key] ?? "0").toLocaleString("en-NG")
                            : (values[field.key] ?? "")
                        }
                        onChange={(e) => {
                          if (isReadonly) return;
                          if (field.type === "number" && field.prefix === "₦") {
                            // Strip commas, store raw number string
                            const raw = e.target.value.replace(/[^0-9.]/g, "");
                            setValues((v) => ({ ...v, [field.key]: raw }));
                          } else {
                            setValues((v) => ({ ...v, [field.key]: e.target.value }));
                          }
                        }}
                        readOnly={isReadonly}
                        placeholder={field.placeholder}
                        className={`flex-1 h-10 px-3 border border-gray-200 text-sm outline-none transition-all
                          ${field.prefix ? "rounded-r-xl" : field.suffix ? "rounded-l-xl" : "rounded-xl"}
                          ${isReadonly
                            ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                            : "bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          }
                        `}
                      />
                      {field.suffix && (
                        <span className="px-3 h-10 flex items-center bg-gray-100 border border-l-0 border-gray-200 rounded-r-xl text-sm text-gray-500 font-medium">
                          {field.suffix}
                        </span>
                      )}
                    </div>
                    {field.hint && (
                      <p className="text-xs text-gray-400 mt-1.5">{field.hint}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Save button */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/40">
              {isSaved ? (
                <span className="flex items-center gap-1.5 text-green-600 text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" /> Saved successfully
                </span>
              ) : (
                <span className="text-xs text-gray-400">
                  {section.title === "Payment" ? "Read-only — manage in .env" : "Changes apply immediately after saving."}
                </span>
              )}
              {section.title !== "Payment" && (
                <button
                  onClick={() => handleSave(section)}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving…" : "Save"}
                </button>
              )}
            </div>
          </div>
        );
      })}

      <BusinessHoursSection initialRaw={initialSettings["business_hours_schedule"]} />

      {SECTIONS.slice(3).map((section) => {
        const Icon = section.icon;
        const isSaving = saving === section.title;
        const isSaved  = saved  === section.title;

        return (
          <div key={section.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{section.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {section.fields.map((field) => {
                const isReadonly = field.key === "paystack_public_key_display";
                return (
                  <div key={field.key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {field.label}
                    </label>
                    <div className="flex items-center gap-0">
                      {field.prefix && (
                        <span className="px-3 h-10 flex items-center bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-500 font-medium">
                          {field.prefix}
                        </span>
                      )}
                      <input
                        type="text"
                        inputMode={field.type === "number" ? "numeric" : field.type === "email" ? "email" : "text"}
                        value={
                          isReadonly
                            ? (typeof window !== "undefined"
                                ? (process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "Not configured")
                                : "Set via environment variable")
                            : field.type === "number" && field.prefix === "₦"
                            ? Number(values[field.key] ?? "0").toLocaleString("en-NG")
                            : (values[field.key] ?? "")
                        }
                        onChange={(e) => {
                          if (isReadonly) return;
                          if (field.type === "number" && field.prefix === "₦") {
                            const raw = e.target.value.replace(/[^0-9.]/g, "");
                            setValues((v) => ({ ...v, [field.key]: raw }));
                          } else {
                            setValues((v) => ({ ...v, [field.key]: e.target.value }));
                          }
                        }}
                        readOnly={isReadonly}
                        placeholder={field.placeholder}
                        className={`flex-1 h-10 px-3 border border-gray-200 text-sm outline-none transition-all
                          ${field.prefix ? "rounded-r-xl" : field.suffix ? "rounded-l-xl" : "rounded-xl"}
                          ${isReadonly
                            ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                            : "bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          }
                        `}
                      />
                      {field.suffix && (
                        <span className="px-3 h-10 flex items-center bg-gray-100 border border-l-0 border-gray-200 rounded-r-xl text-sm text-gray-500 font-medium">
                          {field.suffix}
                        </span>
                      )}
                    </div>
                    {field.hint && (
                      <p className="text-xs text-gray-400 mt-1.5">{field.hint}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/40">
              {isSaved ? (
                <span className="flex items-center gap-1.5 text-green-600 text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" /> Saved successfully
                </span>
              ) : (
                <span className="text-xs text-gray-400">
                  {section.title === "Payment" ? "Read-only — manage in .env" : "Changes apply immediately after saving."}
                </span>
              )}
              {section.title !== "Payment" && (
                <button
                  onClick={() => handleSave(section)}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving…" : "Save"}
                </button>
              )}
            </div>
          </div>
        );
      })}

      <NotificationSettingsSection initialSettings={initialSettings} />
    </div>
  );
}
