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

/** Returns true if the notification setting is enabled (default: true when key is absent). */
export async function isNotifEnabled(key: string): Promise<boolean> {
  try {
    const s = await prisma.siteSetting.findUnique({ where: { key } });
    return !s || s.value !== "false";
  } catch {
    return true;
  }
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    return await prisma.notification.create({ data: input });
  } catch {
    // non-fatal
  }
}

export async function notifyAdmins(
  title: string,
  message: string,
  bookingId?: string
) {
  try {
    if (!(await isNotifEnabled("notify_admin_new_booking"))) return;
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

// Map each BookingStatus to the SiteSetting key that controls its notification
export const STATUS_NOTIFY_KEY: Record<string, string> = {
  SAMPLE_COLLECTED: "notify_on_sample_collected",
  IN_PROGRESS:      "notify_on_in_progress",
  RESULTS_READY:    "notify_on_results_ready",
  COMPLETED:        "notify_on_completed",
  CANCELLED:        "notify_on_cancelled",
};
