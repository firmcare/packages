import { requireAdmin } from "@/lib/auth-utils";
import EmailComposer from "@/components/admin/EmailComposer";

export default async function AdminEmailPage() {
  await requireAdmin();
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Email</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Send broadcast emails to users and view email delivery logs.
        </p>
      </div>
      <EmailComposer />
    </div>
  );
}
