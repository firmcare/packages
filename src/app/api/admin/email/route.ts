import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  recipientType: z.enum(["all", "users", "agents", "admins", "specific"]),
  specificEmails: z.array(z.string().email()).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    await requireAdmin();
    const body = schema.parse(await req.json());

    const job = await prisma.emailBroadcastJob.create({
      data: {
        subject: body.subject,
        htmlContent: body.htmlContent,
        recipientType: body.recipientType,
        specificEmails: body.specificEmails?.length
          ? JSON.stringify(body.specificEmails)
          : null,
        actorId: session!.user.id,
        status: "QUEUED",
      },
    });

    return NextResponse.json({ jobId: job.id, status: "QUEUED" }, { status: 202 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// GET — fetch email logs
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 50;

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.emailLog.count(),
    ]);

    return NextResponse.json({ logs, total, page });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
