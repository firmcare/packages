import { requireAdmin } from "@/lib/auth-utils";
import { adminFetch } from "@/lib/server-fetch";
import DashboardStats from "@/components/admin/DashboardStats";
import RecentBookings from "@/components/admin/RecentBookings";
import RevenueChart from "@/components/admin/RevenueChart";

function formatRevenue(amount: number): { display: string; tooltip: string } {
  const tooltip = `₦${amount.toLocaleString()}`;
  if (amount >= 1_000_000_000) return { display: `₦${(amount / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "")}B`, tooltip };
  if (amount >= 1_000_000)     return { display: `₦${(amount / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`, tooltip };
  return { display: tooltip, tooltip };
}

export default async function AdminDashboard() {
  await requireAdmin();
  const data = await adminFetch<any>("/api/admin/dashboard");

  const revenue = formatRevenue(Number(data.totalRevenue));
  const stats = [
    { title: "Total Bookings", value: data.totalBookings.toString(), color: "blue"    as const, iconName: "calendar" as const, ...data.changes.bookings },
    { title: "Total Revenue",  value: revenue.display, tooltip: revenue.tooltip, color: "emerald" as const, iconName: "banknote" as const, ...data.changes.revenue },
    { title: "Total Users",    value: data.totalUsers.toString(),    color: "violet"  as const, iconName: "users"    as const, ...data.changes.users },
    { title: "Total Packages", value: data.totalPackages.toString(), color: "amber"   as const, iconName: "package"  as const, ...data.changes.packages },
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
            {data.bookingsByStatus.map((item: any) => (
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
