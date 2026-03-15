import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    // Deactivate: change role to USER
    if (body.action === "deactivate") {
      const userRole = await prisma.customRole.findUnique({ where: { name: "USER" } });
      if (!userRole) return new NextResponse("USER role not found", { status: 500 });
      await prisma.user.update({ where: { id }, data: { roleId: userRole.id } });
      return NextResponse.json({ success: true });
    }

    // Reactivate: change role back to AGENT
    if (body.action === "reactivate") {
      const agentRole = await prisma.customRole.upsert({
        where: { name: "AGENT" },
        update: {},
        create: { name: "AGENT", description: "Marketing agent", isSystem: true },
      });
      await prisma.user.update({ where: { id }, data: { roleId: agentRole.id } });
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

    // Only deactivate (change to USER role) rather than hard-delete to preserve referral history
    const userRole = await prisma.customRole.findUnique({ where: { name: "USER" } });
    if (!userRole) return new NextResponse("USER role not found", { status: 500 });
    await prisma.user.update({ where: { id }, data: { roleId: userRole.id } });
    return NextResponse.json({ success: true });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
