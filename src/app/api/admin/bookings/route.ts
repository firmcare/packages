import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { serializeForClient } from "@/lib/serialize-for-client";

export async function GET() {
  try {
    await requireAdmin();
    const bookings = await prisma.booking.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        package: { select: { id: true, title: true, price: true } },
        referralRewards: {
          take: 1,
          include: { referrer: { select: { name: true, referralCode: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(serializeForClient(bookings));
  } catch (err) {
    console.error("GET /api/admin/bookings error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
