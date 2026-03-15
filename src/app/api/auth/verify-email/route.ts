import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) {
      return new NextResponse("Token required", { status: 400 });
    }

    const record = await prisma.emailVerification.findUnique({ where: { token } });

    if (!record) {
      return NextResponse.json({ success: false, message: "Invalid verification link." }, { status: 400 });
    }
    if (record.used) {
      return NextResponse.json({ success: false, message: "This link has already been used." }, { status: 400 });
    }
    if (record.expiresAt < new Date()) {
      return NextResponse.json({ success: false, message: "Verification link has expired. Please request a new one." }, { status: 400 });
    }

    // Mark token used + verify user
    await prisma.$transaction([
      prisma.emailVerification.update({ where: { token }, data: { used: true } }),
      prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
    ]);

    // Send welcome email
    const user = await prisma.user.findUnique({
      where: { id: record.userId },
      select: { email: true, name: true, referralCode: true },
    });
    if (user) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      sendWelcomeEmail(user.email, user.name, user.referralCode, baseUrl).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
