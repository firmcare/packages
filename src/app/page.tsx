
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import HeroV2 from "@/components/home/HeroV2";
import ServicesSection from "@/components/home/ServicesSection";
import WhyTrustUs from "@/components/home/WhyTrustUs";
import ClientsSection from "@/components/home/ClientsSection";
import PackageList from "@/components/home/PackageList";
import SearchAndCategories from "@/components/home/SearchAndCategories";
import Testimonials from "@/components/home/Testimonials";
import BecomeAgent from "@/components/home/BecomeAgent";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://firmcare.com.ng";

export const metadata: Metadata = {
  title: "FirmCare Diagnostics - Precision Diagnostics for Preventive Care",
  description: "Expert diagnostic and medical screening services in Abuja, Nigeria. Comprehensive laboratory packages for female wellness, male wellness, fertility, cancer screening, and more. Book your health screening today.",
  openGraph: {
    title: "FirmCare Diagnostics - Precision Diagnostics for Preventive Care",
    description: "Expert diagnostic and medical screening services in Abuja, Nigeria. Comprehensive laboratory packages for female wellness, male wellness, fertility, cancer screening, and more.",
    url: siteUrl,
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "FirmCare Diagnostics",
      },
    ],
  },
  alternates: {
    canonical: siteUrl,
  },
};

async function getAgentPercent(): Promise<number> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "referral_reward_percent_agent" },
    });
    return row ? parseFloat(row.value) : 10;
  } catch {
    return 10;
  }
}

export default async function Home() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role === "ADMIN" || role === "SUPERADMIN") redirect("/admin");
  if (role === "AGENT") redirect("/agent/dashboard");

  const agentPercent = await getAgentPercent();

  return (
    <>
      {/* New hero: full-background carousel with numbered navigation */}
      <HeroV2 />

      {/* New: Our services (3 audience cards) */}
      <AnimatedSection animation="fadeIn">
        <ServicesSection />
      </AnimatedSection>

      {/* New: Why Trust Us (split image + bullets) */}
      <AnimatedSection animation="fadeIn" delay={100}>
        <WhyTrustUs />
      </AnimatedSection>

      {/* Search & test finder */}
      <AnimatedSection animation="fadeIn" delay={100}>
        <SearchAndCategories />
      </AnimatedSection>

      {/* Package grid */}
      <AnimatedSection animation="slideInUp" delay={100}>
        <PackageList />
      </AnimatedSection>

      {/* New: Client logos */}
      <AnimatedSection animation="fadeIn" delay={100}>
        <ClientsSection />
      </AnimatedSection>

      {/* Testimonials */}
      <AnimatedSection animation="fadeIn" delay={100}>
        <Testimonials />
      </AnimatedSection>

      {/* Become an agent */}
      <AnimatedSection animation="fadeIn" delay={100}>
        <BecomeAgent agentPercent={agentPercent} />
      </AnimatedSection>
    </>
  );
}
