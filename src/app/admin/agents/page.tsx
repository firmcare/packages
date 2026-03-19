import { requireAdmin } from "@/lib/auth-utils";
import { adminFetch } from "@/lib/server-fetch";
import AgentsManager from "@/components/admin/AgentsManager";
import AgentApplicationsManager from "@/components/admin/AgentApplicationsManager";

export default async function AdminAgentsPage() {
  await requireAdmin();
  const { agents, pendingApplicationsCount } = await adminFetch<any>("/api/admin/agents");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketing Agents</h1>
          <p className="text-gray-500 mt-1 text-sm">Onboard marketing officers and track their referral performance.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <p className="text-2xl font-extrabold text-gray-900">{agents.filter((a: any) => a.isActive).length}</p>
          <p className="text-sm text-gray-500 mt-0.5">Active Agents</p>
          {agents.some((a: any) => !a.isActive) && (
            <p className="text-xs text-red-400 mt-0.5">{agents.filter((a: any) => !a.isActive).length} deactivated</p>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <p className="text-2xl font-extrabold text-gray-900">{agents.reduce((s: number, a: any) => s + a.totalReferrals, 0)}</p>
          <p className="text-sm text-gray-500 mt-0.5">Total Referrals</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <p className="text-2xl font-extrabold text-gray-900">₦{agents.reduce((s: number, a: any) => s + a.paidOutAmount, 0).toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-0.5">Total Paid Out</p>
        </div>
      </div>
      <AgentsManager initialAgents={agents} />
      <div className="mt-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900">Agent Applications</h2>
          {pendingApplicationsCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{pendingApplicationsCount} pending</span>
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
