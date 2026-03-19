import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { serializeForClient } from "@/lib/serialize-for-client";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const test = await prisma.test.findUnique({ where: { id } });
    if (!test) return new NextResponse("Not Found", { status: 404 });
    return NextResponse.json(serializeForClient(test));
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
