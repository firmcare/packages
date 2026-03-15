import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import PromoForm from "@/components/admin/PromoForm";

async function getPackages() {
  return await prisma.package.findMany({
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  });
}

export default async function NewPromoPage() {
  await requireAdmin();
  const packages = await getPackages();

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

