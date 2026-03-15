import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import ReferralsTable from "@/components/admin/ReferralsTable";

async function getReferralData() {
  const [rewards, stats, typeStats] = await Promise.all([
    prisma.referralReward.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        referrer: { select: { id: true, name: true, email: true, referralCode: true, role: { select: { name: true } } } },
        referee:  { select: { id: true, name: true, email: true } },
        booking:  {
          select: {
            id: true,
            totalAmount: true,
            createdAt: true,
            package: { select: { title: true } },
          },
        },
      },
    }),
    prisma.referralReward.groupBy({
      by: ["status"],
      _count: true,
      _sum: { amount: true },
    }),
    prisma.referralReward.groupBy({
      by: ["referralType"],
      _count: true,
      _sum: { amount: true },
    }),
  ]);
  return { rewards, stats, typeStats };
}

export default async function ReferralsPage() {
  await requireAdmin();
  const { rewards, stats, typeStats } = await getReferralData();

  const pendingStats   = stats.find((s) => s.status === "PENDING");
  const paidStats      = stats.find((s) => s.status === "PAID");
  const cancelledStats = stats.find((s) => s.status === "CANCELLED");

  const userStats  = typeStats.find((s) => s.referralType === "USER");
  const adminStats = typeStats.find((s) => s.referralType === "ADMIN");
  const agentStats = typeStats.find((s) => s.referralType === "AGENT");

  const summaryCards = [
    { label: "Total Referrals",  value: rewards.length,                sub: "All time" },
    { label: "Pending Rewards",  value: pendingStats?._count ?? 0,     sub: `₦${Number(pendingStats?._sum?.amount ?? 0).toLocaleString()} outstanding` },
    { label: "Rewards Paid",     value: paidStats?._count ?? 0,        sub: `₦${Number(paidStats?._sum?.amount ?? 0).toLocaleString()} paid out` },
    { label: "Cancelled",        value: cancelledStats?._count ?? 0,   sub: "Voided rewards" },
  ];

  const typeCards = [
    { label: "User Referrals",  value: userStats?._count ?? 0,  sub: `₦${Number(userStats?._sum?.amount ?? 0).toLocaleString()}`,  color: "bg-blue-50 text-blue-700"   },
    { label: "Admin Referrals", value: adminStats?._count ?? 0, sub: `₦${Number(adminStats?._sum?.amount ?? 0).toLocaleString()}`, color: "bg-orange-50 text-orange-700" },
    { label: "Agent Referrals", value: agentStats?._count ?? 0, sub: `₦${Number(agentStats?._sum?.amount ?? 0).toLocaleString()}`, color: "bg-purple-50 text-purple-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Referrals</h1>
        <p className="text-gray-500 mt-1 text-sm">Track referral rewards and pay out earnings to users.</p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-2xl font-extrabold text-gray-900">{card.value}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{card.label}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Type breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {typeCards.map((card) => (
          <div key={card.label} className={`rounded-xl p-4 border border-transparent ${card.color}`}>
            <p className="text-2xl font-extrabold">{card.value}</p>
            <p className="text-sm font-semibold mt-0.5">{card.label}</p>
            <p className="text-xs opacity-70 mt-1">{card.sub} total rewards</p>
          </div>
        ))}
      </div>

      <ReferralsTable rewards={rewards} />
    </div>
  );
}
