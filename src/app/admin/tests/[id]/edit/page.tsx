import { requireAdmin } from "@/lib/auth-utils";
import { adminFetch } from "@/lib/server-fetch";
import { notFound } from "next/navigation";
import TestForm from "@/components/admin/TestForm";

interface PageProps { params: Promise<{ id: string }> }

export default async function EditTestPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  try {
    const test = await adminFetch<any>(`/api/admin/tests/${id}`);
    return (
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Test</h1>
          <p className="text-gray-600 mt-2">Update test information</p>
        </div>
        <TestForm initialData={test} />
      </div>
    );
  } catch { notFound(); }
}
