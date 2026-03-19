import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

function buildMonthlyRevenue(bookings: { createdAt: string; totalAmount: any }[]) {
  const map = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    map.set(key, 0);
  }
  for (const b of bookings) {
    const key = new Date(b.createdAt).toLocaleString("en-US", { month: "short", year: "2-digit" });
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + Number(b.totalAmount));
  }
  return Array.from(map.entries()).map(([month, revenue]) => ({ month, revenue }));
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return { change: null, trend: "neutral" as const };
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 0.05) return { change: "0%", trend: "neutral" as const };
  const sign = pct > 0 ? "+" : "";
  return { change: `${sign}${pct.toFixed(1)}%`, trend: (pct > 0 ? "up" : "down") as "up" | "down" };
}

export async function GET() {
  try {
    await requireAdmin();
    const userRole = await prisma.customRole.findUnique({ where: { name: "USER" } });
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalBookings, totalRevenue, totalUsers, totalPackages,
      recentMonthBookings, bookingsByStatus,
      thisMonthBookings, lastMonthBookings,
      thisMonthRevenue, lastMonthRevenue,
      thisMonthUsers, lastMonthUsers,
      thisMonthPackages, lastMonthPackages,
      recentBookings,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.aggregate({ _sum: { totalAmount: true } }),
      prisma.user.count({ where: { roleId: userRole?.id } }),
      prisma.package.count(),
      prisma.booking.findMany({ where: { createdAt: { gte: sixMonthsAgo } }, select: { createdAt: true, totalAmount: true } }),
      prisma.booking.groupBy({ by: ["status"], _count: true }),
      prisma.booking.count({ where: { createdAt: { gte: startOfThisMonth } } }),
      prisma.booking.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } } }),
      prisma.booking.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: startOfThisMonth } } }),
      prisma.booking.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } } }),
      prisma.user.count({ where: { roleId: userRole?.id, createdAt: { gte: startOfThisMonth } } }),
      prisma.user.count({ where: { roleId: userRole?.id, createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } } }),
      prisma.package.count({ where: { createdAt: { gte: startOfThisMonth } } }),
      prisma.package.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } } }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          package: { select: { title: true } },
        },
      }),
    ]);

    return NextResponse.json({
      totalBookings,
      totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
      totalUsers,
      totalPackages,
      bookingsByStatus,
      monthlyRevenue: buildMonthlyRevenue(recentMonthBookings.map(b => ({ ...b, createdAt: b.createdAt.toISOString() }))),
      changes: {
        bookings: pctChange(thisMonthBookings, lastMonthBookings),
        revenue: pctChange(Number(thisMonthRevenue._sum.totalAmount ?? 0), Number(lastMonthRevenue._sum.totalAmount ?? 0)),
        users: pctChange(thisMonthUsers, lastMonthUsers),
        packages: pctChange(thisMonthPackages, lastMonthPackages),
      },
      recentBookings: recentBookings.map(b => ({
        ...b,
        totalAmount: Number(b.totalAmount),
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      })),
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
