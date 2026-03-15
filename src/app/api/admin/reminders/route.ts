import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { sendReminders } from "@/lib/send-reminders";

// GET — return current reminder settings
export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: ["reminder_days_before", "reminders_enabled"] } },
    });
    const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return NextResponse.json({
      reminderDaysBefore: s.reminder_days_before ?? "1,3",
      remindersEnabled: s.reminders_enabled !== "false",
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST — trigger sending reminders now
export async function POST(req: Request) {
  try {
    // Allow both admin session and cron secret
    const { searchParams } = new URL(req.url);
    const cronSecret = searchParams.get("secret");
    const isCron = cronSecret && cronSecret === process.env.CRON_SECRET;

    if (!isCron) {
      await requireAdmin();
    }

    const result = await sendReminders();

    if (result.skipped) {
      return NextResponse.json({ skipped: true, reason: result.reason });
    }

    return NextResponse.json({ success: true, sent: result.sent, failed: result.failed });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
