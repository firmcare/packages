import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";
import crypto from "crypto";

async function requireSuperAdminApi() {
  const session = await auth();
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  });
  if (!user || user.role.name !== "SUPERADMIN") return null;
  return session;
}

// PATCH /api/admin/admins/[id] — change role (ADMIN ↔ SUPERADMIN)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminApi();
    if (!session) return new NextResponse("Forbidden", { status: 403 });

    const { id } = await params;
    if (id === session.user.id) {
      return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
    }

    const body = await req.json();

    // Reactivate a deactivated admin
    if (body.action === "reactivate") {
      const target = await prisma.user.findUnique({ where: { id }, select: { name: true, email: true } });
      await prisma.user.update({ where: { id }, data: { isActive: true } });
      await logAudit(session.user.id, "ADMIN_REACTIVATED", "User", id,
        `Reactivated admin account for ${target?.name ?? target?.email}`);
      return NextResponse.json({ success: true });
    }

    // Reset admin password
    if (body.action === "reset_password") {
      const newPassword = crypto.randomBytes(8).toString("hex");
      const hashed = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({ where: { id }, data: { password: hashed } });
      await logAudit(session.user.id, "ADMIN_PASSWORD_RESET", "User", id, "Password reset by super admin");
      return NextResponse.json({ tempPassword: newPassword });
    }

    // Change role (ADMIN ↔ SUPERADMIN)
    const { role: roleName } = body;
    if (!["ADMIN", "SUPERADMIN"].includes(roleName)) {
      return NextResponse.json({ error: "Role must be ADMIN or SUPERADMIN" }, { status: 400 });
    }

    const targetRole = await prisma.customRole.findUnique({ where: { name: roleName } });
    if (!targetRole) return NextResponse.json({ error: "Role not found" }, { status: 404 });

    const updated = await prisma.user.update({
      where: { id },
      data: { roleId: targetRole.id },
      select: { id: true, name: true, email: true, role: { select: { id: true, name: true } } },
    });

    await logAudit(session.user.id, "ROLE_CHANGE", "User", id,
      `Changed role of ${updated.name ?? updated.email} to ${roleName}`);

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[admin/admins/[id] PATCH]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE /api/admin/admins/[id] — deactivate admin (keeps role, blocks access)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminApi();
    if (!session) return new NextResponse("Forbidden", { status: 403 });

    const { id } = await params;
    if (id === session.user.id) {
      return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { name: true, email: true } });
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    await logAudit(session.user.id, "ADMIN_DEACTIVATED", "User", id,
      `Deactivated admin account for ${target?.name ?? target?.email}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/admins/[id] DELETE]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
