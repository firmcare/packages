import { requireSuperAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/admin/SettingsForm";

const DEFAULTS: Record<string, string> = {
  site_name:               "FirmCare Diagnostics",
  site_url:                "https://firmcare.com.ng",
  contact_email:           "info@firmcare.com.ng",
  contact_phone:           "+234-808-874-3272",
  home_collection_fee:     "15000",
  booking_advance_days:    "1",
  referral_reward_percent_user:  "5",
  referral_reward_percent_admin: "3",
  referral_reward_percent_agent: "10",
  business_hours_open:     "08:00",
  business_hours_close:    "17:00",
  business_days:           "Monday,Tuesday,Wednesday,Thursday,Friday",
  smtp_host:               "",
  smtp_port:               "587",
  smtp_user:               "",
  smtp_from_name:          "FirmCare Diagnostics",
  smtp_from_email:         "",
  reminders_enabled:       "true",
  reminder_days_before:    "1,3",
};

export default async function SettingsPage() {
  await requireSuperAdmin();

  const rows = await prisma.siteSetting.findMany();
  const saved = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const settings = Object.fromEntries(
    Object.keys(DEFAULTS).map((k) => [k, saved[k] ?? DEFAULTS[k]])
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage application configuration. Changes take effect immediately.</p>
      </div>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
