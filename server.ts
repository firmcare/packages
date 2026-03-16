import "dotenv/config"; // must be first — loads .env before any other module runs
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import cron, { ScheduledTask } from "node-cron";
import { prisma } from "./src/lib/prisma";
import { sendReminders } from "./src/lib/send-reminders";

const DEFAULT_SCHEDULE = "0 7 * * *";
const POLL_INTERVAL_MS = 60 * 1000; // check DB for schedule changes every 60 seconds

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);
const app = next({ dev });
const handle = app.getRequestHandler();

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
    console.error(`[Cron] Invalid schedule expression: "${schedule}" — keeping previous.`);
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

  console.log(`> Reminder cron active: "${schedule}"`);
}

async function initCron() {
  const schedule = await readScheduleFromDb();
  applyCronTask(schedule);

  // Poll DB for schedule changes so admins can update without restarting
  setInterval(async () => {
    const newSchedule = await readScheduleFromDb();
    if (newSchedule !== currentSchedule) {
      console.log(`[Cron] Schedule updated: "${currentSchedule}" → "${newSchedule}"`);
      applyCronTask(newSchedule);
    }
  }, POLL_INTERVAL_MS);
}

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }).listen(port, () => {
    console.log(`> Server ready on http://localhost:${port} [${process.env.NODE_ENV ?? "development"}]`);
    initCron();
  });
});
