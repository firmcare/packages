import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-utils";

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
  business_hours_open:     "08:00",
  business_hours_close:    "17:00",
  business_days:           "Monday,Tuesday,Wednesday,Thursday,Friday",
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

    return NextResponse.json({ success: true });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
