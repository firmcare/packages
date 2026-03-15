import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";

async function getAnalyticsData() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const userRole = await prisma.customRole.findUnique({ where: { name: 'USER' } });

  const [
    totalUsers,
    newUsersThisMonth,
    totalBookings,
    bookingsThisMonth,
    totalRevenue,
    revenueThisMonth,
    popularPackages,
    bookingsByStatus,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count({ where: { roleId: userRole?.id } }),
    prisma.user.count({
      where: {
        roleId: userRole?.id,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.booking.count(),
    prisma.booking.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.booking.aggregate({
      _sum: { totalAmount: true },
    }),
    prisma.booking.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo } },
      _sum: { totalAmount: true },
    }),
    prisma.package.findMany({
      select: {
        title: true,
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: {
        bookings: {
          _count: "desc",
        },
      },
      take: 5,
    }),
    prisma.booking.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        status: true,
        user: { select: { name: true } },
        package: { select: { title: true } },
      },
    }),
  ]);

  return {
    totalUsers,
    newUsersThisMonth,
    totalBookings,
    bookingsThisMonth,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    revenueThisMonth: revenueThisMonth._sum.totalAmount || 0,
    popularPackages,
    bookingsByStatus,
    recentActivity,
  };
}

export default async function AnalyticsPage() {
  await requireAdmin();
  const data = await getAnalyticsData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Detailed insights and metrics</p>
      </div>

      <AnalyticsDashboard data={data} />
    </div>
  );
}

