import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { serializeForClient } from "@/lib/serialize-for-client";

export async function GET() {
  try {
    await requireAdmin();
    const [categories, tests] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.test.findMany({ orderBy: { name: "asc" } }),
    ]);
    return NextResponse.json({ categories: serializeForClient(categories), tests: serializeForClient(tests) });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
