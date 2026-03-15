import { requireAdmin } from "@/lib/auth-utils";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <AdminShell user={session.user} userRole={session.user.role as "ADMIN" | "SUPERADMIN" | "USER"}>
      {children}
    </AdminShell>
  );
}
