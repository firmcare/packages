import { requireAdmin } from "@/lib/auth-utils";
import AuditLogTable from "@/components/admin/AuditLogTable";

export default async function AuditLogPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-600 mt-2">Every admin action tracked — who did what, when, and to what.</p>
      </div>
      <AuditLogTable />
    </div>
  );
}
