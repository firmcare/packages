import { requireAdmin } from "@/lib/auth-utils";
import { adminFetch } from "@/lib/server-fetch";
import PromoForm from "@/components/admin/PromoForm";

export default async function NewPromoPage() {
  await requireAdmin();
  const { packages } = await adminFetch<any>("/api/admin/promos");
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Promo Code</h1>
        <p className="text-gray-600 mt-2">Create a new promotional discount code</p>
      </div>
      <PromoForm packages={packages} />
    </div>
  );
}
