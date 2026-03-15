import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { serializeForClient } from "@/lib/serialize-for-client";
import Link from "next/link";
import { Plus, TestTube } from "lucide-react";
import PackageList from "@/components/admin/PackageList";

async function getPackages() {
  const packages = await prisma.package.findMany({
    include: {
      category: true,
      tests: true,
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return serializeForClient(packages);
}

export default async function PackagesPage() {
  await requireAdmin();
  const packages = await getPackages();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Packages</h1>
          <p className="text-gray-600 mt-2">Manage your medical packages</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/tests"
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <TestTube className="w-5 h-5" />
            Tests
          </Link>
          <Link
            href="/admin/packages/new"
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-[#8a3a7a] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Package
          </Link>
        </div>
      </div>

      <PackageList packages={packages} />
    </div>
  );
}

