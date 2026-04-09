import { prisma } from "@/lib/prisma";
import CustomPackageBuilder from "@/components/pages/CustomPackageBuilder";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://firmcare.com.ng";

export const metadata: Metadata = {
  title: "Build Your Custom Package - FirmCare Diagnostics",
  description: "Handpick individual diagnostic tests and build a personalised health screening package tailored to your needs. Available in Abuja, Nigeria.",
  keywords: ["custom diagnostic package", "build your own test", "personalised health screening", "individual lab tests", "Abuja diagnostics"],
  openGraph: {
    title: "Build Your Custom Diagnostic Package — FirmCare",
    description: "Choose exactly the tests you need and build a personalised screening package.",
    url: `${siteUrl}/custom-package`,
    type: "website",
    images: [{ url: `${siteUrl}/og-image.jpg`, width: 1200, height: 630, alt: "Custom Package Builder" }],
  },
  twitter: { card: "summary_large_image", title: "Build Your Custom Package — FirmCare", description: "Choose exactly the tests you need and build a personalised screening package.", images: [`${siteUrl}/og-image.jpg`] },
  alternates: { canonical: `${siteUrl}/custom-package` },
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
