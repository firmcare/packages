import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const { email } = schema.parse(await req.json());

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, emailVerified: true },
    });

    // Always return 200 to prevent email enumeration
    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true });
    }

    // Invalidate previous unused tokens
    await prisma.emailVerification.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    sendVerificationEmail(user.email, user.name, token, baseUrl).catch(console.error);

    return NextResponse.json({ success: true });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
