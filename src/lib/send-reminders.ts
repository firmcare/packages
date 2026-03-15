import { prisma } from "./prisma";
import { sendBookingReminderEmail } from "./email";

export interface ReminderResult {
  sent: number;
  failed: number;
  skipped?: boolean;
  reason?: string;
}

export async function sendReminders(): Promise<ReminderResult> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ["reminder_days_before", "reminders_enabled"] } },
  });
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  if (s.reminders_enabled === "false") {
    return { sent: 0, failed: 0, skipped: true, reason: "Reminders are disabled." };
  }

  const daysBefore = (s.reminder_days_before ?? "1,3")
    .split(",")
    .map((d) => parseInt(d.trim(), 10))
    .filter((d) => !isNaN(d) && d > 0);

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  let totalSent = 0;
  let totalFailed = 0;

  for (const days of daysBefore) {
    const targetStart = new Date();
    targetStart.setDate(targetStart.getDate() + days);
    targetStart.setHours(0, 0, 0, 0);

    const targetEnd = new Date(targetStart);
    targetEnd.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        date: { gte: targetStart, lte: targetEnd },
        status: { in: ["CONFIRMED", "PENDING", "SAMPLE_COLLECTED", "IN_PROGRESS"] },
      },
      include: {
        user: { select: { email: true, name: true } },
        package: { select: { title: true } },
      },
    });

    for (const booking of bookings) {
      const result = await sendBookingReminderEmail(
        booking.user.email,
        booking.user.name,
        booking.package.title,
        booking.date,
        days,
        booking.homeCollection,
        baseUrl
      );
      if (result.success) totalSent++;
      else totalFailed++;
    }
  }

  const now = new Date().toISOString();
  const resultStr = `sent:${totalSent},failed:${totalFailed}`;

  // Persist last run metadata (fire-and-forget)
  Promise.all([
    prisma.siteSetting.upsert({
      where: { key: "reminder_last_run" },
      update: { value: now },
      create: { key: "reminder_last_run", value: now },
    }),
    prisma.siteSetting.upsert({
      where: { key: "reminder_last_result" },
      update: { value: resultStr },
      create: { key: "reminder_last_result", value: resultStr },
    }),
  ]).catch(console.error);

  return { sent: totalSent, failed: totalFailed };
}
