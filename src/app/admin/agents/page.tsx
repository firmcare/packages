import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import AgentsManager from "@/components/admin/AgentsManager";
import AgentApplicationsManager from "@/components/admin/AgentApplicationsManager";

async function getAgents() {
  const agentRole = await prisma.customRole.findUnique({ where: { name: "AGENT" } });
  if (!agentRole) return [];

  const agents = await prisma.user.findMany({
    where: { roleId: agentRole.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      referralCode: true,
      createdAt: true,
      _count: { select: { referralRewardsGiven: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    agents.map(async (agent) => {
      const [earned, pending] = await Promise.all([
        prisma.referralReward.aggregate({
          where: { referrerId: agent.id, status: "PAID" },
          _sum: { amount: true },
        }),
        prisma.referralReward.aggregate({
          where: { referrerId: agent.id, status: "PENDING" },
          _sum: { amount: true },
        }),
      ]);
      return {
        ...agent,
        totalReferrals: agent._count.referralRewardsGiven,
        totalEarned:    Number(earned._sum.amount ?? 0),
        pendingAmount:  Number(pending._sum.amount ?? 0),
      };
    })
  );
}

async function getPendingApplicationsCount() {
  return prisma.agentApplication.count({ where: { status: "PENDING" } });
}

export default async function AdminAgentsPage() {
  await requireAdmin();
  const [agents, pendingCount] = await Promise.all([getAgents(), getPendingApplicationsCount()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketing Agents</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Onboard marketing officers and track their referral performance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <p className="text-2xl font-extrabold text-gray-900">{agents.length}</p>
          <p className="text-sm text-gray-500 mt-0.5">Total Agents</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <p className="text-2xl font-extrabold text-gray-900">
            {agents.reduce((s, a) => s + a.totalReferrals, 0)}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">Total Referrals</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <p className="text-2xl font-extrabold text-gray-900">
            ₦{agents.reduce((s, a) => s + a.totalEarned, 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">Total Paid Out</p>
        </div>
      </div>

      <AgentsManager initialAgents={agents} />

      {/* Applications section */}
      <div className="mt-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900">Agent Applications</h2>
          {pendingCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
              {pendingCount} pending
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Self-registered applications from the "Become an Agent" form. Review and approve or reject after offline due diligence.
        </p>
        <AgentApplicationsManager />
      </div>
    </div>
  );
}
