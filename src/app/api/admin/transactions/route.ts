import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

export async function GET() {
  try {
    await requireAdmin();
    const [transactions, totalRevenue, completedCount, pendingCount, failedCount] = await Promise.all([
      prisma.transaction.findMany({
        include: {
          user: { select: { name: true, email: true } },
          booking: { select: { id: true, date: true } },
          promo: { select: { code: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.transaction.aggregate({ where: { status: "COMPLETED" }, _sum: { finalAmount: true } }),
      prisma.transaction.count({ where: { status: "COMPLETED" } }),
      prisma.transaction.count({ where: { status: "PENDING" } }),
      prisma.transaction.count({ where: { status: "FAILED" } }),
    ]);

    return NextResponse.json({
      transactions: transactions.map(t => ({
        ...t,
        amount: Number(t.amount),
        discount: Number(t.discount),
        finalAmount: Number(t.finalAmount),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        booking: t.booking ? { ...t.booking, date: t.booking.date.toISOString() } : null,
      })),
      stats: {
        totalRevenue: Number(totalRevenue._sum.finalAmount ?? 0),
        completedCount,
        pendingCount,
        failedCount,
      },
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
