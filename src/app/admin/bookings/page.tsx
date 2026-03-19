import { requireAdmin } from "@/lib/auth-utils";
import { adminFetch } from "@/lib/server-fetch";
import BookingManagement from "@/components/admin/BookingManagement";

export default async function BookingsPage() {
  await requireAdmin();
  const bookings = await adminFetch<any[]>("/api/admin/bookings");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-600 mt-2">Manage customer bookings and upload results</p>
      </div>
      <BookingManagement bookings={bookings} />
    </div>
  );
}
