import BecomeAgent from "@/components/home/BecomeAgent";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { LogIn } from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://firmcare.com.ng";

export const metadata: Metadata = {
  title: "Become a FirmCare Agent — Earn Commission on Health Screenings",
  description:
    "Join the FirmCare partner programme. Refer clients to our diagnostic packages, earn commission on every successful booking, and withdraw directly to your bank.",
  keywords: [
    "FirmCare agent",
    "health affiliate",
    "diagnostic referral programme",
    "earn commission healthcare",
    "Nigeria",
  ],
  openGraph: {
    title: "Become a FirmCare Agent",
    description:
      "Refer clients, earn commission on every booking, and withdraw to your bank. Apply today.",
    url: `${siteUrl}/become-an-agent`,
    type: "website",
    images: [{ url: `${siteUrl}/og-image.jpg`, width: 1200, height: 630, alt: "Become a FirmCare Agent" }],
  },
  alternates: { canonical: `${siteUrl}/become-an-agent` },
};

export default async function BecomeAnAgentPage() {
  // Read the current commission rate from site settings
  const setting = await prisma.siteSetting.findUnique({ where: { key: "agent_reward_percent" } });
  const agentPercent = setting ? parseFloat(setting.value) : 10;

  return (
    <div className="bg-white min-h-screen">
      {/* Hero banner */}
      <div className="bg-linear-to-r from-[#7b2d72] via-[#9d4496] to-[#c45fad] py-14 px-4">
        <div className="max-w-3xl mx-auto text-center text-white">
          <span className="inline-block px-4 py-1.5 bg-white/20 text-white text-xs font-bold rounded-full uppercase tracking-widest mb-5">
            Partner Programme
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Become a FirmCare Agent
          </h1>
          <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            Earn <span className="font-bold text-white">{agentPercent}% commission</span> on every successful booking
            you refer. Join our growing network and help people access quality diagnostics.
          </p>
        </div>
      </div>

      {/* Already an agent? Login bar */}
      <div className="bg-purple-50 border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <LogIn className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Already a FirmCare Agent?</p>
              <p className="text-xs text-gray-500">Access your dashboard, referral links, and earnings.</p>
            </div>
          </div>
          <Link
            href="/auth/login"
            className="shrink-0 flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-primary-dark transition-colors shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            Agent Login
          </Link>
        </div>
      </div>

      {/* Application section (reuses the home component, stripped of outer section padding) */}
      <BecomeAgent agentPercent={agentPercent} />
    </div>
  );
}
