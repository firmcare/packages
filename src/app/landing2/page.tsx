
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Hero from "@/components/home/Hero";
import InfoSection from "@/components/home/InfoSection";
import PackageList from "@/components/home/PackageList";
import SearchAndCategories from "@/components/home/SearchAndCategories";
import Testimonials from "@/components/home/Testimonials";
import BecomeAgent from "@/components/home/BecomeAgent";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FirmCare Diagnostics - Precision Diagnostics for Preventive Care",
  description: "Expert diagnostic and medical screening services in Abuja, Nigeria.",
  robots: { index: false, follow: false },
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

export default async function Landing2Page() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role === "ADMIN" || role === "SUPERADMIN") redirect("/admin");
  if (role === "AGENT") redirect("/agent/dashboard");

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
