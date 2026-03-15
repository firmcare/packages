import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { sendReminders } from "@/lib/send-reminders";
import { CronExpressionParser } from "cron-parser";
import { z } from "zod";

const SCHEDULER_KEYS = [
  "reminders_enabled",
  "reminder_cron_schedule",
  "reminder_days_before",
  "reminder_last_run",
  "reminder_last_result",
];

const DEFAULT_SCHEDULE = "0 7 * * *";

function nextRunDate(schedule: string): string | null {
  try {
    const interval = CronExpressionParser.parse(schedule, { tz: "UTC" });
    return interval.next().toDate().toISOString();
  } catch {
    return null;
  }
}

function isValidCron(schedule: string): boolean {
  try {
    CronExpressionParser.parse(schedule);
    return true;
  } catch {
    return false;
  }
}

// GET — full scheduler status
export async function GET() {
  try {
    await requireAdmin();

    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: SCHEDULER_KEYS } },
    });
    const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    const schedule = s.reminder_cron_schedule || DEFAULT_SCHEDULE;
    const lastResult = s.reminder_last_result ?? null;
    let lastSent: number | null = null;
    let lastFailed: number | null = null;
    if (lastResult) {
      const m = lastResult.match(/sent:(\d+),failed:(\d+)/);
      if (m) { lastSent = parseInt(m[1]); lastFailed = parseInt(m[2]); }
    }

    return NextResponse.json({
      enabled: s.reminders_enabled !== "false",
      schedule,
      daysBefore: s.reminder_days_before ?? "1,3",
      lastRun: s.reminder_last_run ?? null,
      lastSent,
      lastFailed,
      nextRun: nextRunDate(schedule),
      scheduleValid: isValidCron(schedule),
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  schedule: z.string().optional(),
  daysBefore: z.string().optional(),
});

// PATCH — update scheduler settings
export async function PATCH(req: Request) {
  try {
    await requireAdmin();

    const body = patchSchema.parse(await req.json());

    if (body.schedule !== undefined && !isValidCron(body.schedule)) {
      return NextResponse.json(
        { success: false, message: "Invalid cron expression." },
        { status: 400 }
      );
    }

    const updates: Record<string, string> = {};
    if (body.enabled !== undefined) updates.reminders_enabled = String(body.enabled);
    if (body.schedule !== undefined) updates.reminder_cron_schedule = body.schedule;
    if (body.daysBefore !== undefined) updates.reminder_days_before = body.daysBefore;

    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    );

    const newSchedule = updates.reminder_cron_schedule;
    return NextResponse.json({
      success: true,
      nextRun: newSchedule ? nextRunDate(newSchedule) : undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST — manually trigger now
export async function POST() {
  try {
    await requireAdmin();
    const result = await sendReminders();
    return NextResponse.json(result);
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
