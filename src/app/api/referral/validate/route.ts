import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code?.trim()) {
      return NextResponse.json({ valid: false, message: "Referral code is required." });
    }

    const upperCode = String(code).trim().toUpperCase();

    // Self-referral check only applies when authenticated
    const session = await auth();
    if (session?.user?.id) {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { referralCode: true },
      });
      if (currentUser?.referralCode === upperCode) {
        return NextResponse.json({ valid: false, message: "You cannot use your own referral code." });
      }
    }

    const referrer = await prisma.user.findUnique({
      where: { referralCode: upperCode },
      select: { id: true, name: true, referralCode: true },
    });

    if (!referrer) {
      return NextResponse.json({ valid: false, message: "Invalid referral code." });
    }

    return NextResponse.json({
      valid: true,
      referrer: { id: referrer.id, name: referrer.name ?? "A FirmCare user" },
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
