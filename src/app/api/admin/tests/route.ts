import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { serializeForClient } from "@/lib/serialize-for-client";

export async function GET() {
  try {
    await requireAdmin();
    const tests = await prisma.test.findMany({
      include: { packages: { select: { id: true, title: true, price: true } }, _count: { select: { packages: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(serializeForClient(tests));
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
