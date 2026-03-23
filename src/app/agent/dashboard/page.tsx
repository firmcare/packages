import { requireAgent } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Gift, Users, TrendingUp, Wallet } from "lucide-react";

async function getAgentStats(userId: string, referralCode: string) {
  const [statsByStatus, totalReferees, recentRewards] = await Promise.all([
    prisma.referralReward.groupBy({
      by: ["status"],
      where: { referrerId: userId },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.user.count({ where: { referredByCode: referralCode } }),
    prisma.referralReward.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        referee: { select: { name: true, email: true } },
        booking: { select: { package: { select: { title: true } } } },
      },
    }),
  ]);

  const pending = statsByStatus.find((r) => r.status === "PENDING");
  const paid    = statsByStatus.find((r) => r.status === "PAID");
  return {
    totalReferees,
    totalRewards:  statsByStatus.reduce((s, r) => s + r._count, 0),
    pendingAmount: Number(pending?._sum?.amount ?? 0),
    paidAmount:    Number(paid?._sum?.amount ?? 0),
    recentRewards,
  };
}

export default async function AgentDashboard() {
  const session = await requireAgent();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, referralCode: true },
  });

  const stats = await getAgentStats(session.user.id, user!.referralCode);

  const cards = [
    { label: "People Referred",  value: stats.totalReferees,             icon: Users,      color: "text-blue-600",   bg: "bg-blue-50"   },
    { label: "Total Rewards",    value: stats.totalRewards,              icon: Gift,       color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Pending Earnings", value: `₦${stats.pendingAmount.toLocaleString()}`, icon: TrendingUp, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Total Paid Out",   value: `₦${stats.paidAmount.toLocaleString()}`,   icon: Wallet,     color: "text-green-600",  bg: "bg-green-50"  },
  ];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://firmcare.com.ng";
  const shareUrl = `${siteUrl}/category/all?ref=${user!.referralCode}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Welcome back, {user?.name ?? "Agent"}. Track your referrals and earnings below.
        </p>
      </div>

      {/* Referral Code Card */}
      <div className="bg-gradient-to-r from-primary to-[#8a3a7a] rounded-2xl p-6 text-white">
        <p className="text-white/70 text-sm font-medium mb-1">Your Referral Code</p>
        <div className="flex items-center gap-3">
          <p className="text-4xl font-extrabold tracking-widest font-mono">{user!.referralCode}</p>
        </div>
        <p className="text-white/70 text-xs mt-3 break-all">{shareUrl}</p>
        <p className="text-white/60 text-xs mt-1">Share this link — earnings are tracked automatically at checkout.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent rewards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Rewards</h2>
        </div>
        {stats.recentRewards.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Gift className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">No rewards yet</p>
            <p className="text-xs mt-1">Share your referral code to start earning rewards</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {stats.recentRewards.map((r) => (
              <div key={r.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.referee.name ?? r.referee.email}</p>
                  <p className="text-xs text-gray-400">{r.booking.package.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">₦{Number(r.amount).toLocaleString()}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    r.status === "PAID" ? "bg-green-100 text-green-700"
                    : r.status === "CANCELLED" ? "bg-red-100 text-red-600"
                    : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
