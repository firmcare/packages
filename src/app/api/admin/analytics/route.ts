import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

export async function GET() {
  try {
    await requireAdmin();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const userRole = await prisma.customRole.findUnique({ where: { name: "USER" } });

    const [
      totalUsers, newUsersThisMonth, totalBookings, bookingsThisMonth,
      totalRevenue, revenueThisMonth, popularPackages, bookingsByStatus, recentActivity,
    ] = await Promise.all([
      prisma.user.count({ where: { roleId: userRole?.id } }),
      prisma.user.count({ where: { roleId: userRole?.id, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.booking.aggregate({ _sum: { totalAmount: true } }),
      prisma.booking.aggregate({ where: { createdAt: { gte: thirtyDaysAgo } }, _sum: { totalAmount: true } }),
      prisma.package.findMany({
        select: { title: true, _count: { select: { bookings: true } } },
        orderBy: { bookings: { _count: "desc" } },
        take: 5,
      }),
      prisma.booking.groupBy({ by: ["status"], _count: true }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: { id: true, createdAt: true, status: true, user: { select: { name: true } }, package: { select: { title: true } } },
      }),
    ]);

    return NextResponse.json({
      totalUsers, newUsersThisMonth, totalBookings, bookingsThisMonth,
      totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
      revenueThisMonth: Number(revenueThisMonth._sum.totalAmount ?? 0),
      popularPackages,
      bookingsByStatus,
      recentActivity: recentActivity.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
