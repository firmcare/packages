import { requireAdmin } from "@/lib/auth-utils";
import { adminFetch } from "@/lib/server-fetch";
import { notFound } from "next/navigation";
import PackageForm from "@/components/admin/PackageForm";

interface PageProps { params: Promise<{ id: string }> }

export default async function EditPackagePage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  try {
    const { pkg, categories, tests } = await adminFetch<any>(`/api/admin/packages/${id}`);
    return (
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Package</h1>
          <p className="text-gray-600 mt-2">Update package information</p>
        </div>
        <PackageForm categories={categories} tests={tests} initialData={pkg} />
      </div>
    );
  } catch { notFound(); }
}
