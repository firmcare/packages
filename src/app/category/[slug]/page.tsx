export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import CategoryView from "@/components/pages/CategoryView";
import { Metadata } from "next";
import { fmtNgn } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categoryName =
    decodeURIComponent(slug).charAt(0).toUpperCase() +
    decodeURIComponent(slug).slice(1);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://firmcare.com.ng";

  return {
    title: `${categoryName} Packages - FirmCare Diagnostics`,
    description: `Browse our comprehensive ${categoryName} diagnostic screening packages. Expert medical testing and preventive care services in Abuja, Nigeria.`,
    keywords: [categoryName, "diagnostic packages", "medical screening", "laboratory tests", "Abuja", "Nigeria"],
    openGraph: {
      title: `${categoryName} Packages - FirmCare Diagnostics`,
      description: `Browse our comprehensive ${categoryName} diagnostic screening packages.`,
      url: `${siteUrl}/category/${slug}`,
      type: "website",
      images: [{ url: `${siteUrl}/og-image.jpg`, width: 1200, height: 630, alt: `${categoryName} Packages` }],
    },
    twitter: { card: 'summary_large_image', title: `${categoryName} Packages - FirmCare Diagnostics`, description: `Browse our comprehensive ${categoryName} diagnostic screening packages.`, images: [`${siteUrl}/og-image.jpg`] },
    alternates: { canonical: `${siteUrl}/category/${slug}` },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const isAll = decodedSlug.toLowerCase() === "all" || decodedSlug.toLowerCase() === "all packages";

  const rows = await prisma.package.findMany({
    where: {
      isActive: true,
      ...(!isAll && { category: { slug: decodedSlug } }),
    },
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

  return <CategoryView category={decodedSlug} packages={packages} />;
}
