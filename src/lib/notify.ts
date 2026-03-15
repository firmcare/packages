import { prisma } from "./prisma";

export type NotificationType =
  | "booking_confirmed"
  | "status_update"
  | "results_ready"
  | "new_booking";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  bookingId?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    return await prisma.notification.create({ data: input });
  } catch {
    // non-fatal — notifications should never break the main flow
  }
}

/**
 * Notify every ADMIN and SUPERADMIN user about a new booking.
 */
export async function notifyAdmins(
  title: string,
  message: string,
  bookingId?: string
) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: { name: { in: ["ADMIN", "SUPERADMIN"] } } },
      select: { id: true },
    });
    if (!admins.length) return;
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: "new_booking" as NotificationType,
        title,
        message,
        bookingId: bookingId ?? null,
      })),
    });
  } catch {
    // non-fatal
  }
}

export const STATUS_NOTIFICATION: Record<
  string,
  { title: string; message: (pkg: string) => string }
> = {
  SAMPLE_COLLECTED: {
    title: "Sample Collected",
    message: (pkg) =>
      `Your sample for "${pkg}" has been collected. Our lab team will begin processing shortly.`,
  },
  IN_PROGRESS: {
    title: "Analysis In Progress",
    message: (pkg) =>
      `Your "${pkg}" sample is being analyzed. We'll notify you when results are ready.`,
  },
  RESULTS_READY: {
    title: "Results Ready",
    message: (pkg) =>
      `Your test results for "${pkg}" are ready. Open your bookings to view and download.`,
  },
  COMPLETED: {
    title: "Booking Completed",
    message: (pkg) =>
      `Your "${pkg}" booking has been marked complete. Thank you for choosing FirmCare!`,
  },
  CANCELLED: {
    title: "Booking Cancelled",
    message: (pkg) =>
      `Your booking for "${pkg}" has been cancelled. Contact us if you have questions.`,
  },
};
