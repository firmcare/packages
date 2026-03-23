import { requireAdmin } from "@/lib/auth-utils";
import { adminFetch } from "@/lib/server-fetch";
import Link from "next/link";
import { Plus, TestTube } from "lucide-react";
import PackageList from "@/components/admin/PackageList";
import CustomPackageCard from "@/components/admin/CustomPackageCard";

export default async function PackagesPage() {
  await requireAdmin();
  const { customPkg, regularPackages, customStats } = await adminFetch<any>("/api/admin/packages");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Packages</h1>
          <p className="text-gray-600 mt-2">Manage your medical packages</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/tests" className="flex items-center gap-2 bg-gray-600 text-white p-2.5 rounded-lg hover:bg-gray-700 transition-colors">
            <TestTube className="w-5 h-5" />
            Tests
          </Link>
          <Link href="/admin/packages/new" className="flex items-center gap-2 bg-primary text-white p-2.5 rounded-lg hover:bg-[#8a3a7a] transition-colors">
            <Plus className="w-5 h-5" />
            Add Package
          </Link>
        </div>
      </div>
      {customPkg && customStats && <CustomPackageCard pkg={customPkg} stats={customStats} />}
      <PackageList packages={regularPackages} />
    </div>
  );
}
