import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

export async function GET() {
  try {
    await requireAdmin();

    const [rewards, stats] = await Promise.all([
      prisma.referralReward.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          referrer: { select: { id: true, name: true, email: true, referralCode: true } },
          referee:  { select: { id: true, name: true, email: true } },
          booking:  { select: { id: true, totalAmount: true, createdAt: true, package: { select: { title: true } } } },
        },
      }),
      prisma.referralReward.groupBy({
        by: ["status"],
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({ rewards, stats });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
