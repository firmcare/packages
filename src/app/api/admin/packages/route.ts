import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { serializeForClient } from "@/lib/serialize-for-client";

export async function GET() {
  try {
    await requireAdmin();
    const allPackages = await prisma.package.findMany({
      include: { category: true, tests: true, _count: { select: { bookings: true } } },
      orderBy: { createdAt: "desc" },
    });

    const customPkg = allPackages.find(p => p.slug === "custom-tailored-package") ?? null;
    const regularPackages = allPackages.filter(p => p.slug !== "custom-tailored-package");

    let customStats = null;
    if (customPkg) {
      const [agg, recent] = await Promise.all([
        prisma.booking.aggregate({
          where: { packageId: customPkg.id },
          _sum: { totalAmount: true },
          _count: { _all: true },
        }),
        prisma.booking.findMany({
          where: { packageId: customPkg.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { user: { select: { name: true, email: true } } },
        }),
      ]);
      customStats = {
        totalBookings: agg._count._all,
        totalRevenue: Number(agg._sum.totalAmount ?? 0),
        recentBookings: recent.map(b => ({
          id: b.id,
          createdAt: b.createdAt.toISOString(),
          totalAmount: Number(b.totalAmount),
          status: b.status,
          notes: b.notes,
          user: b.user,
        })),
      };
    }

    return NextResponse.json({
      customPkg: customPkg ? serializeForClient(customPkg) : null,
      regularPackages: serializeForClient(regularPackages),
      customStats,
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
