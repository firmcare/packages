import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(_req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const setting = await prisma.siteSetting.findUnique({
      where: { key: "notification_retention_days" },
    });
    const days = Math.max(1, parseInt(setting?.value ?? "30", 10) || 30);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { count } = await prisma.notification.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    return NextResponse.json({ deleted: count, retentionDays: days });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
