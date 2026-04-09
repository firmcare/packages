"use client";

import { useState } from "react";
import { Edit, CalendarX2 } from "lucide-react";
import BookingDetailsModal from "./BookingDetailsModal";
import Pagination, { PageSizeSelector } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import DateRangeFilter, { DateRange, inRange } from "@/components/ui/DateRangeFilter";

interface Booking {
  id: string;
  date: Date;
  status: string;
  totalAmount: any;
  homeCollection: boolean;
  resultPdfUrl: string | null;
  notes: string | null;
  paymentRef: string | null;
  referralCode: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  package: {
    id: string;
    title: string;
    price: any;
  };
  referralRewards?: Array<{
    referrer: { name: string | null; referralCode: string };
  }>;
}

interface BookingManagementProps {
  bookings: Booking[];
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SAMPLE_COLLECTED: "bg-indigo-100 text-indigo-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  RESULTS_READY: "bg-teal-100 text-teal-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SAMPLE_COLLECTED: "Sample Collected",
  IN_PROGRESS: "In Progress",
  RESULTS_READY: "Results Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function BookingManagement({ bookings }: BookingManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const filteredBookings = bookings.filter((booking) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q ||
      booking.user.name?.toLowerCase().includes(q) ||
      booking.user.email?.toLowerCase().includes(q) ||
      booking.package.title.toLowerCase().includes(q) ||
      booking.paymentRef?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || booking.status === statusFilter;
    const matchesDate = inRange(booking.date, dateRange.from, dateRange.to);
    return matchesSearch && matchesStatus && matchesDate;
  });

  const { page, setPage, totalPages, paged, totalItems, pageSize, setPageSize } = usePagination(filteredBookings, 20);

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by user, package or booking ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />
          </div>
          <DateRangeFilter value={dateRange} onChange={(r) => { setDateRange(r); setPage(1); }} />
        </div>

        {filteredBookings.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <CalendarX2 className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">No bookings found</p>
            <p className="text-xs mt-1">Try adjusting your search, status, or date filter</p>
          </div>
        ) : (
        <>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paged.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 whitespace-nowrap">
                    {booking.paymentRef ? (
                      <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {booking.paymentRef}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-medium text-gray-900 leading-tight">{booking.user.name || "N/A"}</div>
                    <div className="text-xs text-gray-400 truncate max-w-30">{booking.user.email}</div>
                  </td>
                  <td className="px-3 py-3 max-w-35">
                    <span className="text-sm text-gray-900 block truncate" title={booking.package.title}>
                      {booking.package.title}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                    {new Date(booking.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" })}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                    ₦{Number(booking.totalAmount).toLocaleString()}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${STATUS_STYLES[booking.status] ?? "bg-gray-100 text-gray-800"}`}>
                      {STATUS_LABELS[booking.status] ?? booking.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="flex items-center gap-1 text-primary hover:text-primary-dark text-sm font-medium"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </div>
        </>
        )}
      </div>

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </>
  );
}
