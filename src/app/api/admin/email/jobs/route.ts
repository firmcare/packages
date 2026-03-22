import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    const jobs = await prisma.emailBroadcastJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        subject: true,
        recipientType: true,
        totalRecipients: true,
        sent: true,
        failed: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        actor: { select: { name: true, email: true } },
      },
    });
    return NextResponse.json(jobs.map((j) => ({
      ...j,
      createdAt: j.createdAt.toISOString(),
      updatedAt: j.updatedAt.toISOString(),
    })));
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
