import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { initiateTransfer } from "@/lib/paystack-transfer";
import crypto from "crypto";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const { action, reason } = await req.json();

  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id },
    include: {
      agent: {
        include: { bankAccount: true },
      },
      rewards: true,
    },
  });

  if (!withdrawal) return new NextResponse("Not found", { status: 404 });

  // ── APPROVE → trigger Paystack transfer ──────────────────────────────────
  if (action === "approve") {
    if (withdrawal.status !== "PENDING") {
      return NextResponse.json({ error: "Only PENDING withdrawals can be approved." }, { status: 422 });
    }

    const bankAccount = withdrawal.agent.bankAccount;
    if (!bankAccount?.paystackRecipientCode) {
      return NextResponse.json(
        { error: "Agent has no bank account or Paystack recipient code on file." },
        { status: 422 }
      );
    }

    const reference = `WDR-${id}-${crypto.randomBytes(4).toString("hex")}`;

    try {
      const transfer = await initiateTransfer(
        bankAccount.paystackRecipientCode,
        Number(withdrawal.amount),
        reference,
        `FirmCare agent referral payout — ${withdrawal.agent.name ?? withdrawal.agent.email}`
      );

      const updated = await prisma.withdrawalRequest.update({
        where: { id },
        data: {
          status: "PROCESSING",
          paystackTransferCode: transfer.transferCode,
          paystackReference: reference,
        },
      });

      return NextResponse.json({ success: true, withdrawal: updated });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transfer failed";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // ── COMPLETE → mark rewards PAID ────────────────────────────────────────
  if (action === "complete") {
    if (withdrawal.status !== "PROCESSING" && withdrawal.status !== "APPROVED") {
      return NextResponse.json({ error: "Withdrawal must be PROCESSING to complete." }, { status: 422 });
    }

    await prisma.$transaction([
      prisma.withdrawalRequest.update({
        where: { id },
        data: { status: "COMPLETED", processedAt: new Date() },
      }),
      prisma.referralReward.updateMany({
        where: { withdrawalId: id },
        data: { status: "PAID" },
      }),
    ]);

    return NextResponse.json({ success: true });
  }

  // ── REJECT ────────────────────────────────────────────────────────────────
  if (action === "reject") {
    if (withdrawal.status !== "PENDING") {
      return NextResponse.json({ error: "Only PENDING withdrawals can be rejected." }, { status: 422 });
    }

    await prisma.$transaction([
      prisma.withdrawalRequest.update({
        where: { id },
        data: { status: "REJECTED", failureReason: reason ?? "Rejected by admin" },
      }),
      // Release rewards back to CONFIRMED so agent can try again
      prisma.referralReward.updateMany({
        where: { withdrawalId: id },
        data: { withdrawalId: null },
      }),
    ]);

    return NextResponse.json({ success: true });
  }

  // ── MARK_FAILED ──────────────────────────────────────────────────────────
  if (action === "mark_failed") {
    await prisma.$transaction([
      prisma.withdrawalRequest.update({
        where: { id },
        data: { status: "FAILED", failureReason: reason ?? "Transfer failed" },
      }),
      // Release rewards so agent can retry
      prisma.referralReward.updateMany({
        where: { withdrawalId: id },
        data: { withdrawalId: null },
      }),
    ]);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
