import { requireSuperAdmin } from "@/lib/auth-utils";
import { adminFetch } from "@/lib/server-fetch";
import { auth } from "@/auth";
import AdminsManager from "@/components/admin/AdminsManager";

export default async function AdminsPage() {
  await requireSuperAdmin();
  const [admins, session] = await Promise.all([
    adminFetch<any[]>("/api/admin/admins"),
    auth(),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
        <p className="text-gray-600 mt-2">Onboard new admins, manage roles, and revoke access. Only Super Admins can access this page.</p>
      </div>
      <AdminsManager admins={admins} currentUserId={session!.user.id} />
    </div>
  );
}
