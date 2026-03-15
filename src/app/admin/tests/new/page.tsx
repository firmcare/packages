import { requireAdmin } from "@/lib/auth-utils";
import TestForm from "@/components/admin/TestForm";

export default async function NewTestPage() {
  await requireAdmin();

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add New Test</h1>
        <p className="text-gray-600 mt-2">Create a new medical test</p>
      </div>

      <TestForm />
    </div>
  );
}
