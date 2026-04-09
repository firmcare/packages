import { prisma } from "@/lib/prisma";
import { generateReferralCode } from "@/lib/referral";
import { sendVerificationEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { normalizeEmail, emailVariantsFilter } from "@/lib/email-utils";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  phone: z.string().optional(),
  callbackUrl: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = signupSchema.parse(body);
    const normalisedEmail = normalizeEmail(validatedData.email);

    const existingUser = await prisma.user.findFirst({
      where: emailVariantsFilter(normalisedEmail),
    });

    if (existingUser) {
      return new NextResponse("User already exists", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    const referralCode = await generateReferralCode(normalisedEmail, validatedData.name);

    const userRole = await prisma.customRole.findUnique({ where: { name: "USER" } });
    if (!userRole) {
      return new NextResponse("User role not found", { status: 500 });
    }

    const user = await prisma.user.create({
      data: {
        email: normalisedEmail,
        password: hashedPassword,
        name: validatedData.name,
        phone: validatedData.phone,
        referralCode,
        roleId: userRole.id,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        referralCode: true,
      },
    });

    // Create email verification token (24h expiry)
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Send verification email (non-blocking — don't fail signup if email fails)
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const cb = validatedData.callbackUrl && validatedData.callbackUrl.startsWith('/')
      ? validatedData.callbackUrl : undefined;
    sendVerificationEmail(normalisedEmail, user.name, token, baseUrl, cb).catch(console.error);

    return NextResponse.json({ ...user, requiresVerification: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
