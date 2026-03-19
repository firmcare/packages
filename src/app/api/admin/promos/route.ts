import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { serializeForClient } from "@/lib/serialize-for-client";

export async function GET() {
  try {
    await requireAdmin();
    const [promos, packages] = await Promise.all([
      prisma.promo.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.package.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    ]);
    return NextResponse.json({ promos: serializeForClient(promos), packages });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
