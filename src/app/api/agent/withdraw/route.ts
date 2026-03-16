import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MIN_WITHDRAWAL = 500; // ₦500 minimum

export async function POST(req: Request) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "AGENT" && role !== "ADMIN" && role !== "SUPERADMIN")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const agentId = session.user.id;

  // Must have a bank account on file
  const bankAccount = await prisma.agentBankAccount.findUnique({ where: { userId: agentId } });
  if (!bankAccount) {
    return NextResponse.json(
      { error: "No bank account on file. Add your bank account before withdrawing." },
      { status: 422 }
    );
  }

  // Block if there's already a pending/processing withdrawal
  const openWithdrawal = await prisma.withdrawalRequest.findFirst({
    where: { agentId, status: { in: ["PENDING", "APPROVED", "PROCESSING"] } },
  });
  if (openWithdrawal) {
    return NextResponse.json(
      { error: "You already have a withdrawal in progress. Please wait for it to complete." },
      { status: 422 }
    );
  }

  // Gather all CONFIRMED rewards not yet attached to a withdrawal
  const rewards = await prisma.referralReward.findMany({
    where: { referrerId: agentId, status: "CONFIRMED", withdrawalId: null },
  });

  if (rewards.length === 0) {
    return NextResponse.json(
      { error: "No confirmed earnings available for withdrawal." },
      { status: 422 }
    );
  }

  const total = rewards.reduce((sum, r) => sum + Number(r.amount), 0);
  if (total < MIN_WITHDRAWAL) {
    return NextResponse.json(
      { error: `Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}. Your confirmed balance is ₦${total.toFixed(2)}.` },
      { status: 422 }
    );
  }

  // Create withdrawal request and link rewards
  const withdrawal = await prisma.withdrawalRequest.create({
    data: {
      agentId,
      amount: total,
      status: "PENDING",
      rewards: { connect: rewards.map((r) => ({ id: r.id })) },
    },
  });

  return NextResponse.json({ success: true, withdrawal });
}
