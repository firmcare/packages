import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = schema.parse(body);

    const record = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!record) {
      return NextResponse.json({ success: false, message: "Invalid or expired reset link." }, { status: 400 });
    }

    if (record.used) {
      return NextResponse.json({ success: false, message: "This reset link has already been used." }, { status: 400 });
    }

    if (record.expiresAt < new Date()) {
      return NextResponse.json({ success: false, message: "This reset link has expired. Please request a new one." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);

    // Update password and mark token as used in a single transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashed },
      }),
      prisma.passwordReset.update({
        where: { id: record.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0].message }, { status: 400 });
    }
    console.error("Reset password error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
