import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const pkg = await prisma.package.findUnique({ where: { id } });

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const updated = await prisma.package.update({
      where: { id },
      data: { isActive: !pkg.isActive },
    });

    await logAudit(session.user.id, "PACKAGE_TOGGLED", "Package", id,
      `"${pkg.title}" ${updated.isActive ? "enabled" : "disabled"}`);

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to toggle package status" }, { status: 500 });
  }
}
