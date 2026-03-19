import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const withdrawals = await prisma.withdrawalRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        agent: { include: { bankAccount: true } },
        rewards: { select: { id: true } },
      },
    });

    return NextResponse.json(withdrawals.map(w => ({
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
        bankAccount: w.agent.bankAccount ? {
          bankName: w.agent.bankAccount.bankName,
          accountNumber: w.agent.bankAccount.accountNumber,
          accountName: w.agent.bankAccount.accountName,
        } : null,
      },
    })));
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
