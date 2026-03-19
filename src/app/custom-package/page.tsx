import { prisma } from "@/lib/prisma";
import CustomPackageBuilder from "@/components/pages/CustomPackageBuilder";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Build Your Custom Package - FirmCare Diagnostics",
  description: "Handpick individual diagnostic tests and build a package tailored to your health needs.",
};

export default async function CustomPackagePage() {
  const dbTests = await prisma.test.findMany({ orderBy: { name: "asc" } });

  const tests = dbTests.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description ?? "",
    price: Number(t.price),
  }));

  return <CustomPackageBuilder dbTests={tests} />;
}
