import { NextResponse } from "next/server";
import { sendReminders } from "@/lib/send-reminders";

/**
 * HTTP-triggered cron endpoint.
 * Can be called by system crontab, uptime monitors, or any external scheduler.
 * Protected by CRON_SECRET to prevent unauthorized triggering.
 *
 * Example crontab entry (runs daily at 8 AM WAT / 7 AM UTC):
 *   0 7 * * * curl -s -H "Authorization: Bearer <CRON_SECRET>" https://yourdomain.com/api/cron/reminders
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await sendReminders();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Cron] Reminder error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
