import { requireAdmin } from "@/lib/auth-utils";
import { adminFetch } from "@/lib/server-fetch";
import Link from "next/link";
import { Plus } from "lucide-react";
import TestList from "@/components/admin/TestList";

export default async function TestsPage() {
  await requireAdmin();
  const tests = await adminFetch<any[]>("/api/admin/tests");
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tests</h1>
          <p className="text-gray-600 mt-2">Manage medical tests</p>
        </div>
        <Link href="/admin/tests/new" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-[#8a3a7a] transition-colors">
          <Plus className="w-5 h-5" />
          Add Test
        </Link>
      </div>
      <TestList tests={tests} />
    </div>
  );
}
