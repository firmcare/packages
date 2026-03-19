import { requireSuperAdmin } from "@/lib/auth-utils";
import { adminFetch } from "@/lib/server-fetch";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  await requireSuperAdmin();
  const settings = await adminFetch<Record<string, string>>("/api/admin/settings");
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
