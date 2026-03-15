"use client";

import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react";

interface AnalyticsData {
  totalUsers: number;
  newUsersThisMonth: number;
  totalBookings: number;
  bookingsThisMonth: number;
  totalRevenue: any;
  revenueThisMonth: any;
  popularPackages: Array<{
    title: string;
    _count: { bookings: number };
  }>;
  bookingsByStatus: Array<{
    status: string;
    _count: number;
  }>;
  recentActivity: Array<{
    id: string;
    createdAt: Date;
    status: string;
    user: { name: string | null };
    package: { title: string };
  }>;
}

export default function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const userGrowth = data.totalUsers > 0
    ? ((data.newUsersThisMonth / data.totalUsers) * 100).toFixed(1)
    : "0";
  
  const bookingGrowth = data.totalBookings > 0
    ? ((data.bookingsThisMonth / data.totalBookings) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-green-600 font-medium">+{userGrowth}%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{data.totalUsers}</h3>
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-xs text-gray-500 mt-1">+{data.newUsersThisMonth} this month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-green-600 font-medium">+{bookingGrowth}%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{data.totalBookings}</h3>
          <p className="text-sm text-gray-600">Total Bookings</p>
          <p className="text-xs text-gray-500 mt-1">+{data.bookingsThisMonth} this month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-green-600 font-medium">
              <TrendingUp className="w-4 h-4 inline" />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            ₦{Number(data.totalRevenue).toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-xs text-gray-500 mt-1">
            ₦{Number(data.revenueThisMonth).toLocaleString()} this month
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            ₦{data.totalBookings > 0 ? Number(Number(data.totalRevenue) / data.totalBookings).toLocaleString() : "0"}
          </h3>
          <p className="text-sm text-gray-600">Avg. Booking Value</p>
        </div>
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Packages */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Popular Packages</h3>
          <div className="space-y-3">
            {data.popularPackages.map((pkg, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="text-sm text-gray-900">{pkg.title}</span>
                </div>
                <span className="text-sm font-semibold text-gray-600">
                  {pkg._count.bookings} bookings
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bookings by Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Bookings by Status</h3>
          <div className="space-y-3">
            {data.bookingsByStatus.map((item) => {
              const percentage = data.totalBookings > 0
                ? ((item._count / data.totalBookings) * 100).toFixed(1)
                : "0";
              
              return (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{item.status}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {item._count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {data.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.user.name || "User"}</span> booked{" "}
                  <span className="font-medium">{activity.package.title}</span>
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  activity.status === "COMPLETED"
                    ? "bg-green-100 text-green-800"
                    : activity.status === "CONFIRMED"
                    ? "bg-blue-100 text-blue-800"
                    : activity.status === "CANCELLED"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {activity.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

