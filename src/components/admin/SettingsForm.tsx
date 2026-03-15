"use client";

import { useState } from "react";
import {
  Settings, Globe, Phone, Mail, Home, Calendar,
  Gift, Clock, CreditCard, CheckCircle, AlertCircle, Save, Bell,
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
    title: "Business Hours",
    description: "Operating hours shown on the site and used in notifications",
    icon: Clock,
    fields: [
      { key: "business_hours_open",  label: "Opening Time", type: "time" },
      { key: "business_hours_close", label: "Closing Time", type: "time" },
      {
        key: "business_days",
        label: "Business Days",
        placeholder: "Monday,Tuesday,Wednesday,Thursday,Friday",
        hint: "Comma-separated list of working days.",
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
  {
    title: "Notifications",
    description: "Automatic reminder emails sent to patients before their appointments",
    icon: Bell,
    fields: [
      {
        key: "reminders_enabled",
        label: "Reminders Enabled",
        placeholder: "true",
        hint: "Set to 'true' to enable automatic reminders, or 'false' to disable.",
      },
      {
        key: "reminder_days_before",
        label: "Reminder Days Before Appointment",
        placeholder: "1,3",
        hint: "Comma-separated list of days before the appointment to send reminders. e.g. '1,3' sends reminders 1 day and 3 days before.",
      },
    ],
  },
];

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

      {SECTIONS.map((section) => {
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
                        type={field.type ?? "text"}
                        value={
                          isReadonly
                            ? (typeof window !== "undefined"
                                ? (process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "Not configured")
                                : "Set via environment variable")
                            : (values[field.key] ?? "")
                        }
                        onChange={(e) =>
                          !isReadonly && setValues((v) => ({ ...v, [field.key]: e.target.value }))
                        }
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
    </div>
  );
}
