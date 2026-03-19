import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { serializeForClient } from "@/lib/serialize-for-client";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [pkg, categories, tests] = await Promise.all([
      prisma.package.findUnique({ where: { id }, include: { tests: { select: { id: true } } } }),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.test.findMany({ orderBy: { name: "asc" } }),
    ]);
    if (!pkg) return new NextResponse("Not Found", { status: 404 });
    return NextResponse.json({
      pkg: serializeForClient(pkg),
      categories: serializeForClient(categories),
      tests: serializeForClient(tests),
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
