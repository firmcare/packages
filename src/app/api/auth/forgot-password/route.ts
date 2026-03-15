import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new NextResponse("Email required", { status: 400 });
    }

    // Always respond with the same message to prevent email enumeration
    const SUCCESS_MSG = { message: "If an account with that email exists, a reset link has been sent." };

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true, password: true },
    });

    // No account — return silently (don't reveal this)
    if (!user) return NextResponse.json(SUCCESS_MSG);

    // Google-only accounts have no password — don't allow password reset
    if (!user.password) return NextResponse.json(SUCCESS_MSG);

    // Invalidate any existing unused tokens for this user
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate a secure random token (hex, 48 chars)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    await sendPasswordResetEmail(user.email, user.name, token, baseUrl);

    return NextResponse.json(SUCCESS_MSG);
  } catch (error) {
    console.error("Forgot password error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
