import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import DashboardStats from "@/components/admin/DashboardStats";
import RecentBookings from "@/components/admin/RecentBookings";
import RevenueChart from "@/components/admin/RevenueChart";

function buildMonthlyRevenue(bookings: { createdAt: Date; totalAmount: any }[]) {
  const map = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    map.set(key, 0);
  }
  for (const b of bookings) {
    const key = new Date(b.createdAt).toLocaleString('en-US', { month: 'short', year: '2-digit' });
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + Number(b.totalAmount));
  }
  return Array.from(map.entries()).map(([month, revenue]) => ({ month, revenue }));
}

async function getDashboardData() {
  const userRole = await prisma.customRole.findUnique({ where: { name: 'USER' } });
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    totalBookings,
    totalRevenue,
    totalUsers,
    totalPackages,
    recentBookings,
    bookingsByStatus,
    recentMonthBookings,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.aggregate({ _sum: { totalAmount: true } }),
    prisma.user.count({ where: { roleId: userRole?.id } }),
    prisma.package.count(),
    prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        package: { select: { title: true } },
      },
    }),
    prisma.booking.groupBy({ by: ["status"], _count: true }),
    prisma.booking.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, totalAmount: true },
    }),
  ]);

  return {
    totalBookings,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    totalUsers,
    totalPackages,
    recentBookings,
    bookingsByStatus,
    monthlyRevenue: buildMonthlyRevenue(recentMonthBookings),
  };
}

export default async function AdminDashboard() {
  await requireAdmin();
  const data = await getDashboardData();

  const stats = [
    {
      title: "Total Bookings",
      value: data.totalBookings.toString(),
      change: "+12%",
      trend: "up" as const,
    },
    {
      title: "Total Revenue",
      value: `₦${Number(data.totalRevenue).toLocaleString()}`,
      change: "+8%",
      trend: "up" as const,
    },
    {
      title: "Total Users",
      value: data.totalUsers.toString(),
      change: "+23%",
      trend: "up" as const,
    },
    {
      title: "Total Packages",
      value: data.totalPackages.toString(),
      change: "0%",
      trend: "neutral" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-2">Welcome to your admin dashboard</p>
      </div>

      <DashboardStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RevenueChart monthlyRevenue={data.monthlyRevenue} />
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Bookings by Status</h3>
          <div className="space-y-3">
            {data.bookingsByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-gray-600">{item.status}</span>
                <span className="font-semibold">{item._count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <RecentBookings bookings={data.recentBookings} />
    </div>
  );
}

