import { requireAgent } from "@/lib/auth-utils";
import { fmtNgn } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import AgentReferralsTable from "@/components/agent/AgentReferralsTable";

export default async function AgentReferralsPage() {
  const session = await requireAgent();

  const rewards = await prisma.referralReward.findMany({
    where: { referrerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      referee: { select: { name: true, email: true } },
      booking: {
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
          package: { select: { title: true } },
        },
      },
    },
  });

  const statsByStatus = await prisma.referralReward.groupBy({
    by: ["status"],
    where: { referrerId: session.user.id },
    _count: true,
    _sum: { amount: true },
  });

  const pending   = statsByStatus.find((r) => r.status === "PENDING");
  const paid      = statsByStatus.find((r) => r.status === "PAID");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Referrals</h1>
        <p className="text-gray-500 mt-1 text-sm">Track all referral rewards earned through your referral code.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Referrals", value: rewards.length,                                        sub: "All time" },
          { label: "Pending",         value: pending?._count ?? 0,                  sub: `${fmtNgn(Number(pending?._sum?.amount ?? 0))} outstanding` },
          { label: "Paid Out",        value: paid?._count ?? 0,                     sub: `${fmtNgn(Number(paid?._sum?.amount ?? 0))} received` },
          { label: "Total Earned",    value: fmtNgn(Number(paid?._sum?.amount ?? 0)), sub: "Confirmed payments" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-2xl font-extrabold text-gray-900">{card.value}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{card.label}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <AgentReferralsTable rewards={rewards.map((r) => ({
        id: r.id,
        amount: Number(r.amount),
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        referee: r.referee,
        booking: r.booking
          ? { id: r.booking.id, totalAmount: Number(r.booking.totalAmount), createdAt: r.booking.createdAt.toISOString(), package: r.booking.package }
          : null,
      }))} />
    </div>
  );
}
