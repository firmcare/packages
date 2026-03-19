import { requireSuperAdmin } from "@/lib/auth-utils";
import { adminFetch } from "@/lib/server-fetch";
import UserManagement from "@/components/admin/UserManagement";

export default async function UsersPage() {
  await requireSuperAdmin();
  const users = await adminFetch<any[]>("/api/admin/users");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">
          Regular user accounts. Admin accounts are managed separately under{" "}
          <span className="font-semibold text-primary">Admin Management</span>.
        </p>
      </div>
      <UserManagement users={users} />
    </div>
  );
}
