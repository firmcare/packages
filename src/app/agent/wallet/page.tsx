import { requireAgent } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import AgentWalletView from "@/components/agent/AgentWalletView";

export const metadata = { title: "Wallet" };

export default async function AgentWalletPage() {
  const session = await requireAgent();
  const agentId = session.user.id;

  const [rewards, withdrawals, bankAccount] = await Promise.all([
    prisma.referralReward.findMany({
      where: { referrerId: agentId },
      orderBy: { createdAt: "desc" },
      include: { booking: { include: { package: { select: { title: true } } } } },
    }),
    prisma.withdrawalRequest.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.agentBankAccount.findUnique({ where: { userId: agentId } }),
  ]);

  const confirmedBalance = rewards
    .filter((r) => r.status === "CONFIRMED" && !r.withdrawalId)
    .reduce((s, r) => s + Number(r.amount), 0);

  const pendingBalance = rewards
    .filter((r) => r.status === "PENDING")
    .reduce((s, r) => s + Number(r.amount), 0);

  const totalPaid = withdrawals
    .filter((w) => w.status === "COMPLETED")
    .reduce((s, w) => s + Number(w.amount), 0);

  return (
    <AgentWalletView
      confirmedBalance={confirmedBalance}
      pendingBalance={pendingBalance}
      totalPaid={totalPaid}
      rewards={rewards.map((r) => ({
        id: r.id,
        amount: Number(r.amount),
        status: r.status,
        referralType: r.referralType,
        packageTitle: r.booking?.package?.title ?? "—",
        createdAt: r.createdAt.toISOString(),
        withdrawalId: r.withdrawalId,
      }))}
      withdrawals={withdrawals.map((w) => ({
        id: w.id,
        amount: Number(w.amount),
        status: w.status,
        paystackReference: w.paystackReference,
        failureReason: w.failureReason,
        processedAt: w.processedAt?.toISOString() ?? null,
        createdAt: w.createdAt.toISOString(),
      }))}
      bankAccount={
        bankAccount
          ? {
              bankName: bankAccount.bankName,
              accountNumber: bankAccount.accountNumber,
              accountName: bankAccount.accountName,
            }
          : null
      }
    />
  );
}
