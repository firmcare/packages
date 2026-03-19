import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-utils";
import { auth } from "@/auth";
import { logAudit } from "@/lib/audit";

// Default values used when a setting hasn't been saved yet
const DEFAULTS: Record<string, string> = {
  site_name:               "FirmCare Diagnostics",
  site_url:                "https://firmcare.com.ng",
  contact_email:           "info@firmcare.com.ng",
  contact_phone:           "+234-808-874-3272",
  home_collection_fee:     "15000",
  booking_advance_days:    "1",
  referral_reward_percent_user:  "5",
  referral_reward_percent_admin: "3",
  referral_reward_percent_agent: "10",
  business_hours_schedule: JSON.stringify({
    Monday:    { enabled: true,  open: "08:00", close: "17:00" },
    Tuesday:   { enabled: true,  open: "08:00", close: "17:00" },
    Wednesday: { enabled: true,  open: "08:00", close: "17:00" },
    Thursday:  { enabled: true,  open: "08:00", close: "17:00" },
    Friday:    { enabled: true,  open: "08:00", close: "17:00" },
    Saturday:  { enabled: true,  open: "09:00", close: "14:00" },
    Sunday:    { enabled: false, open: "09:00", close: "12:00" },
  }),
  smtp_host:               "",
  smtp_port:               "587",
  smtp_user:               "",
  smtp_from_name:          "FirmCare Diagnostics",
  smtp_from_email:         "",
  reminders_enabled:       "true",
  reminder_days_before:    "1,3",
};

export async function GET() {
  try {
    await requireSuperAdmin();

    const rows = await prisma.siteSetting.findMany();
    const saved = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    // Merge saved values with defaults so all keys are always present
    const settings = Object.fromEntries(
      Object.keys(DEFAULTS).map((k) => [k, saved[k] ?? DEFAULTS[k]])
    );

    return NextResponse.json(settings);
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireSuperAdmin();
    const session = await auth();

    const updates: Record<string, string> = await req.json();

    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    if (session?.user?.id) {
      const keys = Object.keys(updates).join(", ");
      await logAudit(session.user.id, "SETTINGS_UPDATED", "SiteSetting", null,
        `Updated settings: ${keys}`);
    }

    return NextResponse.json({ success: true });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
