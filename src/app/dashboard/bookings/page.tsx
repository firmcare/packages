export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AutoRefresh from "@/components/AutoRefresh";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShoppingBag,
  FlaskConical,
  Microscope,
  FileCheck,
} from "lucide-react";
import ResultViewer from "@/components/ResultViewer";

const statusIcon: Record<string, React.ReactNode> = {
  PENDING: <Clock className="w-4 h-4" />,
  CONFIRMED: <AlertCircle className="w-4 h-4" />,
  SAMPLE_COLLECTED: <FlaskConical className="w-4 h-4" />,
  IN_PROGRESS: <Microscope className="w-4 h-4" />,
  RESULTS_READY: <FileCheck className="w-4 h-4" />,
  COMPLETED: <CheckCircle className="w-4 h-4" />,
  CANCELLED: <XCircle className="w-4 h-4" />,
};

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  SAMPLE_COLLECTED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  IN_PROGRESS: "bg-purple-50 text-purple-700 border-purple-200",
  RESULTS_READY: "bg-teal-50 text-teal-700 border-teal-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SAMPLE_COLLECTED: "Sample Collected",
  IN_PROGRESS: "In Progress",
  RESULTS_READY: "Results Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "SAMPLE_COLLECTED", "IN_PROGRESS", "RESULTS_READY"];

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/dashboard/bookings");

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: {
      package: {
        select: { title: true, price: true, category: { select: { name: true } } },
      },
    },
    orderBy: { date: "desc" },
  });

  const upcoming = bookings.filter(
    (b) => ACTIVE_STATUSES.includes(b.status) && new Date(b.date) >= new Date()
  );
  const past = bookings.filter(
    (b) => b.status === "COMPLETED" || b.status === "CANCELLED" || new Date(b.date) < new Date()
  );

  const BookingCard = ({ booking }: { booking: (typeof bookings)[0] }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{booking.package.title}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{booking.package.category.name}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm ml-11">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Date</p>
              <p className="text-gray-700 font-medium">
                {new Date(booking.date).toLocaleDateString("en-NG", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Amount</p>
              <p className="text-gray-700 font-medium">
                ₦{Number(booking.totalAmount).toLocaleString()}
              </p>
            </div>
            {booking.homeCollection && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Collection</p>
                <p className="text-gray-700 font-medium">Home Sample Collection</p>
              </div>
            )}
            {booking.notes && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Note</p>
                <p className="text-gray-700">{booking.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${statusColor[booking.status] ?? "bg-gray-50 text-gray-700 border-gray-200"}`}
          >
            {statusIcon[booking.status]}
            {statusLabel[booking.status] ?? booking.status}
          </span>

          {booking.resultPdfUrl && (
            <ResultViewer bookingId={booking.id} packageTitle={booking.package.title} />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <AutoRefresh intervalMs={30000} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 mt-1">Track and manage your health screening appointments.</p>
        </div>
        <Link
          href="/category/all"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#8a3a7a] transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          Book New
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
          <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No bookings yet</h3>
          <p className="text-gray-500 mb-6">Browse our packages and book your first health screening.</p>
          <Link
            href="/category/all"
            className="inline-block bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-[#8a3a7a] transition-colors"
          >
            Browse Packages
          </Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Upcoming ({upcoming.length})
              </h2>
              <div className="space-y-4">
                {upcoming.map((b) => <BookingCard key={b.id} booking={b} />)}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Past Bookings ({past.length})
              </h2>
              <div className="space-y-4">
                {past.map((b) => <BookingCard key={b.id} booking={b} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
