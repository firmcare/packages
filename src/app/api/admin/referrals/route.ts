import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

export async function GET() {
  try {
    await requireAdmin();
    const [rewards, stats, typeStats] = await Promise.all([
      prisma.referralReward.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          referrer: { select: { id: true, name: true, email: true, referralCode: true, role: { select: { name: true } } } },
          referee: { select: { id: true, name: true, email: true } },
          booking: { select: { id: true, totalAmount: true, discountAmount: true, date: true, createdAt: true, homeCollection: true, package: { select: { title: true } } } },
        },
      }),
      prisma.referralReward.groupBy({ by: ["status"], _count: true, _sum: { amount: true } }),
      prisma.referralReward.groupBy({ by: ["referralType"], _count: true, _sum: { amount: true } }),
    ]);

    return NextResponse.json({
      rewards: rewards.map(r => ({
        ...r,
        amount: Number(r.amount),
        rewardPercent: Number(r.rewardPercent),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        booking: r.booking ? {
          ...r.booking,
          totalAmount: Number(r.booking.totalAmount),
          discountAmount: Number(r.booking.discountAmount),
          date: r.booking.date.toISOString(),
          createdAt: r.booking.createdAt.toISOString(),
        } : null,
      })),
      stats,
      typeStats,
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
