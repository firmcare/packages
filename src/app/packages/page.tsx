export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import CategoryView from "@/components/pages/CategoryView";
import { Metadata } from "next";
import { fmtNgn } from "@/lib/format";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://firmcare.com.ng";

export const metadata: Metadata = {
  title: "All Packages - FirmCare Diagnostics",
  description:
    "Browse our comprehensive diagnostic screening packages. Expert medical testing and preventive care services in Abuja, Nigeria.",
  keywords: [
    "diagnostic packages",
    "medical screening",
    "laboratory tests",
    "health packages",
    "Abuja",
    "Nigeria",
  ],
  openGraph: {
    title: "All Packages - FirmCare Diagnostics",
    description:
      "Browse our comprehensive diagnostic screening packages. Expert medical testing and preventive care services in Abuja, Nigeria.",
    url: `${siteUrl}/packages`,
    type: "website",
    images: [{ url: `${siteUrl}/og-image.jpg`, width: 1200, height: 630, alt: "FirmCare Packages" }],
  },
  alternates: { canonical: `${siteUrl}/packages` },
};

export default async function PackagesPage() {
  const rows = await prisma.package.findMany({
    where: { isActive: true },
    include: { category: { select: { name: true } } },
    orderBy: { title: "asc" },
  });

  const packages = rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    price: fmtNgn(Number(p.price)),
    imageUrl: p.imageUrl ?? null,
    category: p.category.name,
  }));

  return <CategoryView category="all" packages={packages} />;
}
