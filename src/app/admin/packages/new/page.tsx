import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { serializeForClient } from "@/lib/serialize-for-client";
import PackageForm from "@/components/admin/PackageForm";

async function getFormData() {
  const [categories, tests] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.test.findMany({ orderBy: { name: "asc" } }),
  ]);

  return {
    categories: serializeForClient(categories),
    tests: serializeForClient(tests),
  };
}

export default async function NewPackagePage() {
  await requireAdmin();
  const { categories, tests } = await getFormData();

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Package</h1>
        <p className="text-gray-600 mt-2">Add a new medical package to your catalog</p>
      </div>

      <PackageForm categories={categories} tests={tests} />
    </div>
  );
}

