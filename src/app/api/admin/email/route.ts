import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { sendGeneralEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  recipientType: z.enum(["all", "verified", "specific"]),
  specificEmails: z.array(z.string().email()).optional(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());

    let emails: string[] = [];

    if (body.recipientType === "specific") {
      emails = body.specificEmails ?? [];
    } else {
      const where = body.recipientType === "verified" ? { emailVerified: true } : {};
      const users = await prisma.user.findMany({ where, select: { email: true } });
      emails = users.map((u) => u.email);
    }

    if (emails.length === 0) {
      return NextResponse.json({ success: false, message: "No recipients found." }, { status: 400 });
    }

    // Send emails sequentially to avoid SMTP rate limits
    let sent = 0;
    let failed = 0;
    for (const email of emails) {
      const result = await sendGeneralEmail(email, body.subject, body.htmlContent);
      if (result.success) sent++;
      else failed++;
    }

    return NextResponse.json({ success: true, sent, failed, total: emails.length });
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
