import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { serializeForClient } from "@/lib/serialize-for-client";
import { notFound } from "next/navigation";
import TestForm from "@/components/admin/TestForm";

async function getTest(id: string) {
  const test = await prisma.test.findUnique({
    where: { id },
  });

  if (!test) {
    notFound();
  }

  return serializeForClient(test);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTestPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const test = await getTest(id);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Test</h1>
        <p className="text-gray-600 mt-2">Update test information</p>
      </div>

      <TestForm initialData={test} />
    </div>
  );
}
