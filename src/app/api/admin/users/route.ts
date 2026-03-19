import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-utils";

export async function GET() {
  try {
    await requireSuperAdmin();
    const users = await prisma.user.findMany({
      where: { role: { name: "USER" } },
      select: {
        id: true, email: true, name: true, phone: true, address: true,
        emailVerified: true, referralCode: true, referredByCode: true, createdAt: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })));
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
