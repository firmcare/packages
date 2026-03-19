import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { logAudit } from "@/lib/audit";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    // Deactivate: set isActive = false (role stays AGENT)
    if (body.action === "deactivate") {
      const target = await prisma.user.findUnique({ where: { id }, select: { name: true, email: true } });
      await prisma.user.update({ where: { id }, data: { isActive: false } });
      if (session?.user?.id) {
        await logAudit(session.user.id, "AGENT_DEACTIVATED", "User", id, `Deactivated agent ${target?.name ?? target?.email}`, {
          resourceName: target?.name ?? target?.email ?? undefined,
        });
      }
      return NextResponse.json({ success: true });
    }

    // Reactivate: set isActive = true
    if (body.action === "reactivate") {
      const target = await prisma.user.findUnique({ where: { id }, select: { name: true, email: true } });
      await prisma.user.update({ where: { id }, data: { isActive: true } });
      if (session?.user?.id) {
        await logAudit(session.user.id, "AGENT_REACTIVATED", "User", id, `Reactivated agent ${target?.name ?? target?.email}`, {
          resourceName: target?.name ?? target?.email ?? undefined,
        });
      }
      return NextResponse.json({ success: true });
    }

    // Reset password
    if (body.action === "reset_password") {
      const newPassword = crypto.randomBytes(8).toString("hex");
      const hashed = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({ where: { id }, data: { password: hashed } });
      return NextResponse.json({ tempPassword: newPassword });
    }

    // General update (name, phone)
    const { name, phone } = body;
    await prisma.user.update({
      where: { id },
      data: {
        ...(name  !== undefined ? { name  } : {}),
        ...(phone !== undefined ? { phone } : {}),
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Soft-deactivate rather than hard-delete to preserve referral history
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
