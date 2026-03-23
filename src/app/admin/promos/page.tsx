import { requireAdmin } from "@/lib/auth-utils";
import { adminFetch } from "@/lib/server-fetch";
import Link from "next/link";
import { Plus } from "lucide-react";
import PromoList from "@/components/admin/PromoList";

export default async function PromosPage() {
  await requireAdmin();
  const { promos } = await adminFetch<any>("/api/admin/promos");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promotional Codes</h1>
          <p className="text-gray-600 mt-2">Create and manage discount codes</p>
        </div>
        <Link href="/admin/promos/new" className="flex items-center text-sm gap-2 bg-primary text-white p-3 rounded-lg hover:bg-primary transition-colors">
          <Plus className="w-5 h-5" />
          Create Promo
        </Link>
      </div>
      <PromoList promos={promos} />
    </div>
  );
}
