import { requireAdmin } from "@/lib/auth-utils";
import { adminFetch } from "@/lib/server-fetch";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PromoForm from "@/components/admin/PromoForm";

export default async function EditPromoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [promo, { packages }] = await Promise.all([
    prisma.promo.findUnique({ where: { id } }),
    adminFetch<any>("/api/admin/promos"),
  ]);

  if (!promo) notFound();

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Promo Code</h1>
        <p className="text-gray-600 mt-2">Update promotional discount code</p>
      </div>
      <PromoForm packages={packages} initialData={promo} />
    </div>
  );
}
