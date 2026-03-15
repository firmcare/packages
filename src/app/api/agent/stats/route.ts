import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  });
  const role = user?.role.name;
  if (!role || (role !== "AGENT" && role !== "ADMIN" && role !== "SUPERADMIN")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const [rewards, statsByStatus, totalReferees] = await Promise.all([
    prisma.referralReward.groupBy({
      by: ["status"],
      where: { referrerId: session.user.id },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.referralReward.groupBy({
      by: ["status"],
      where: { referrerId: session.user.id },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.user.count({ where: { referredByCode: user!.referralCode } }),
  ]);

  const pending   = rewards.find((r) => r.status === "PENDING");
  const paid      = rewards.find((r) => r.status === "PAID");
  const cancelled = rewards.find((r) => r.status === "CANCELLED");

  return NextResponse.json({
    referralCode: user!.referralCode,
    totalReferees,
    totalRewards:      rewards.reduce((s, r) => s + r._count, 0),
    pendingCount:      pending?._count ?? 0,
    pendingAmount:     Number(pending?._sum?.amount ?? 0),
    paidCount:         paid?._count ?? 0,
    paidAmount:        Number(paid?._sum?.amount ?? 0),
    cancelledCount:    cancelled?._count ?? 0,
    totalEarned:       Number(paid?._sum?.amount ?? 0),
  });
}
