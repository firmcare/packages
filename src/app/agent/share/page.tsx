import { requireAgent } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import AgentShareLinks from "@/components/agent/AgentShareLinks";

export default async function AgentSharePage() {
  const session = await requireAgent();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { referralCode: true },
  });

  const packages = await prisma.package.findMany({
    where: { isActive: true },
    select: { id: true, title: true, slug: true, price: true, category: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Share Links</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Copy package links pre-loaded with your referral code to share with potential customers.
        </p>
      </div>

      <AgentShareLinks
        referralCode={user!.referralCode}
        packages={packages.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          price: Number(p.price),
          category: p.category.name,
        }))}
      />
    </div>
  );
}
