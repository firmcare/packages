import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, FileText, ShoppingBag, User, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const statusIcon: Record<string, React.ReactNode> = {
  PENDING: <Clock className="w-4 h-4 text-yellow-500" />,
  CONFIRMED: <AlertCircle className="w-4 h-4 text-blue-500" />,
  COMPLETED: <CheckCircle className="w-4 h-4 text-green-500" />,
  CANCELLED: <XCircle className="w-4 h-4 text-red-500" />,
};

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/dashboard");

  const [user, bookings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, referralCode: true },
    }),
    prisma.booking.findMany({
      where: { userId: session.user.id },
      include: { package: { select: { title: true, price: true } } },
      orderBy: { date: "desc" },
      take: 5,
    }),
  ]);

  const totalBookings = await prisma.booking.count({ where: { userId: session.user.id } });
  const upcomingBookings = await prisma.booking.count({
    where: { userId: session.user.id, status: { in: ["PENDING", "CONFIRMED"] }, date: { gte: new Date() } },
  });
  const completedBookings = await prisma.booking.count({
    where: { userId: session.user.id, status: "COMPLETED" },
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting()}, {user?.name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s a summary of your health activity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Bookings</p>
            <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Clock className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Upcoming</p>
            <p className="text-2xl font-bold text-gray-900">{upcomingBookings}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-gray-900">{completedBookings}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Book a Test", href: "/category/all", icon: ShoppingBag, color: "bg-primary" },
            { label: "My Bookings", href: "/dashboard/bookings", icon: Calendar, color: "bg-blue-500" },
            { label: "View Results", href: "/dashboard/bookings", icon: FileText, color: "bg-green-500" },
            { label: "Edit Profile", href: "/dashboard/profile", icon: User, color: "bg-orange-500" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href + action.label}
                href={action.href}
                className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className={`p-3 ${action.color} rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
          <Link href="/dashboard/bookings" className="text-sm text-primary hover:text-[#8a3a7a] font-medium">
            View all
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">You haven&apos;t made any bookings yet.</p>
            <Link
              href="/category/all"
              className="inline-block bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#8a3a7a] transition-colors"
            >
              Browse Packages
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {bookings.map((booking) => (
              <div key={booking.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{booking.package.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date(booking.date).toLocaleDateString("en-NG", {
                      weekday: "short", year: "numeric", month: "short", day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {booking.resultPdfUrl && (
                    <a
                      href={booking.resultPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:text-[#8a3a7a] font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      Result
                    </a>
                  )}
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[booking.status]}`}>
                    {statusIcon[booking.status]}
                    {statusLabel[booking.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Referral Code */}
      {user?.referralCode && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Your Referral Code</h3>
          <p className="text-sm text-gray-500 mb-3">Share this code with friends and family.</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2 text-lg font-mono font-bold text-primary tracking-widest">
              {user.referralCode}
            </code>
          </div>
        </div>
      )}
    </div>
  );
}
