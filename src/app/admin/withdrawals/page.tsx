import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import WithdrawalsManager from "@/components/admin/WithdrawalsManager";

export const metadata = { title: "Agent Withdrawals" };

export default async function WithdrawalsPage() {
  await requireAdmin();

  const withdrawals = await prisma.withdrawalRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      agent: {
        select: { id: true, name: true, email: true, referralCode: true },
        include: { bankAccount: true },
      },
      rewards: { select: { id: true } },
    },
  });

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter((w) => w.status === "PENDING").length,
    processing: withdrawals.filter((w) => w.status === "PROCESSING").length,
    totalPaid: withdrawals
      .filter((w) => w.status === "COMPLETED")
      .reduce((s, w) => s + Number(w.amount), 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agent Withdrawals</h1>
        <p className="text-sm text-gray-500 mt-1">Review and process agent payout requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: stats.total, color: "text-gray-900" },
          { label: "Pending Review", value: stats.pending, color: "text-yellow-600" },
          { label: "Processing", value: stats.processing, color: "text-purple-600" },
          {
            label: "Total Paid Out",
            value: "₦" + stats.totalPaid.toLocaleString("en-NG", { minimumFractionDigits: 2 }),
            color: "text-green-600",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-medium text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <WithdrawalsManager
        initialWithdrawals={withdrawals.map((w) => ({
          id: w.id,
          amount: Number(w.amount),
          status: w.status,
          paystackTransferCode: w.paystackTransferCode,
          paystackReference: w.paystackReference,
          failureReason: w.failureReason,
          processedAt: w.processedAt?.toISOString() ?? null,
          createdAt: w.createdAt.toISOString(),
          rewardCount: w.rewards.length,
          agent: {
            id: w.agent.id,
            name: w.agent.name,
            email: w.agent.email,
            referralCode: w.agent.referralCode,
            bankAccount: w.agent.bankAccount
              ? {
                  bankName: w.agent.bankAccount.bankName,
                  accountNumber: w.agent.bankAccount.accountNumber,
                  accountName: w.agent.bankAccount.accountName,
                }
              : null,
          },
        }))}
      />
    </div>
  );
}
