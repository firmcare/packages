import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import BookingManagement from "@/components/admin/BookingManagement";

async function getBookings() {
  return await prisma.booking.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
      package: {
        select: { id: true, title: true, price: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function BookingsPage() {
  await requireAdmin();
  const bookings = await getBookings();

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

