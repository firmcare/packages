
import Hero from "@/components/home/Hero";
import InfoSection from "@/components/home/InfoSection";
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
  const agentPercent = await getAgentPercent();
  return (
    <>
      <Hero />
      <AnimatedSection animation="fadeIn">
        <SearchAndCategories />
      </AnimatedSection>
      <AnimatedSection animation="slideInUp" delay={100}>
        <PackageList />
      </AnimatedSection>
      <AnimatedSection animation="fadeIn" delay={150}>
        <Testimonials />
      </AnimatedSection>
      <AnimatedSection animation="slideInUp" delay={200}>
        <InfoSection />
      </AnimatedSection>
      <AnimatedSection animation="fadeIn" delay={250}>
        <BecomeAgent agentPercent={agentPercent} />
      </AnimatedSection>
    </>
  );
}
