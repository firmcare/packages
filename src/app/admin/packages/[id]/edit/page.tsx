import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { serializeForClient } from "@/lib/serialize-for-client";
import { notFound } from "next/navigation";
import PackageForm from "@/components/admin/PackageForm";

async function getPackageData(id: string) {
  const [pkg, categories, tests] = await Promise.all([
    prisma.package.findUnique({
      where: { id },
      include: { tests: { select: { id: true } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.test.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!pkg) {
    notFound();
  }

  return {
    pkg: serializeForClient(pkg),
    categories: serializeForClient(categories),
    tests: serializeForClient(tests),
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPackagePage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const { pkg, categories, tests } = await getPackageData(id);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Package</h1>
        <p className="text-gray-600 mt-2">Update package information</p>
      </div>

      <PackageForm categories={categories} tests={tests} initialData={pkg} />
    </div>
  );
}

