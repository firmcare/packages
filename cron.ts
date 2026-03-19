/**
 * Standalone cron process — run alongside `next start` on your VPS.
 * Usage:  tsx cron.ts
 * Or via PM2:  pm2 start ecosystem.config.js
 *
 * Reads the reminder schedule from the DB so admins can change it
 * without restarting this process.
 */
import "dotenv/config";
import cron, { ScheduledTask } from "node-cron";
import { prisma } from "./src/lib/prisma";
import { sendReminders } from "./src/lib/send-reminders";

const DEFAULT_SCHEDULE = "0 7 * * *";
const POLL_INTERVAL_MS = 60 * 1000;

let currentTask: ScheduledTask | null = null;
let currentSchedule = "";

async function readScheduleFromDb(): Promise<string> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "reminder_cron_schedule" },
    });
    return row?.value || process.env.REMINDER_CRON_SCHEDULE || DEFAULT_SCHEDULE;
  } catch {
    return process.env.REMINDER_CRON_SCHEDULE || DEFAULT_SCHEDULE;
  }
}

function applyCronTask(schedule: string) {
  if (!cron.validate(schedule)) {
    console.error(`[Cron] Invalid schedule: "${schedule}" — keeping previous.`);
    return;
  }
  if (currentTask) {
    currentTask.stop();
    currentTask = null;
    console.log(`[Cron] Stopped previous task (was: "${currentSchedule}")`);
  }
  currentSchedule = schedule;
  currentTask = cron.schedule(schedule, async () => {
    console.log(`[Cron] ${new Date().toISOString()} — Running booking reminders...`);
    try {
      const result = await sendReminders();
      if (result.skipped) {
        console.log(`[Cron] Skipped: ${result.reason}`);
      } else {
        console.log(`[Cron] Done — ${result.sent} sent, ${result.failed} failed.`);
      }
    } catch (err) {
      console.error("[Cron] Error:", err);
    }
  });
  console.log(`[Cron] Active — schedule: "${schedule}"`);
}

async function main() {
  const schedule = await readScheduleFromDb();
  applyCronTask(schedule);

  setInterval(async () => {
    const newSchedule = await readScheduleFromDb();
    if (newSchedule !== currentSchedule) {
      console.log(`[Cron] Schedule updated: "${currentSchedule}" → "${newSchedule}"`);
      applyCronTask(newSchedule);
    }
  }, POLL_INTERVAL_MS);

  console.log("[Cron] Process running. Press Ctrl+C to stop.");
}

main();
