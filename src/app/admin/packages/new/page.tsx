import { requireAdmin } from "@/lib/auth-utils";
import { adminFetch } from "@/lib/server-fetch";
import PackageForm from "@/components/admin/PackageForm";

export default async function NewPackagePage() {
  await requireAdmin();
  const { categories, tests } = await adminFetch<any>("/api/admin/packages/form-data");
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
