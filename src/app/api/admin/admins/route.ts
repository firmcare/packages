import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { logAudit } from "@/lib/audit";

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

function generateReferralCode(name: string): string {
  const prefix = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "ADM";
  const suffix = Date.now().toString(36).slice(-4).toUpperCase();
  return `${prefix}${suffix}`;
}

// GET /api/admin/admins — list all ADMIN + SUPERADMIN users
export async function GET() {
  try {
    const session = await requireSuperAdminApi();
    if (!session) return new NextResponse("Forbidden", { status: 403 });

    const admins = await prisma.user.findMany({
      where: {
        role: { name: { in: ["ADMIN", "SUPERADMIN"] } },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        emailVerified: true,
        isActive: true,
        role: { select: { id: true, name: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      admins.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error("[admin/admins GET]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST /api/admin/admins — onboard a new admin
export async function POST(req: Request) {
  try {
    const session = await requireSuperAdminApi();
    if (!session) return new NextResponse("Forbidden", { status: 403 });

    const { name, email, role: roleName, password: rawPassword } = await req.json();

    if (!name || !email || !roleName) {
      return NextResponse.json({ error: "name, email, and role are required" }, { status: 400 });
    }
    if (!["ADMIN", "SUPERADMIN"].includes(roleName)) {
      return NextResponse.json({ error: "Role must be ADMIN or SUPERADMIN" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Upgrade existing user to the specified admin role
      const targetRole = await prisma.customRole.findUnique({ where: { name: roleName } });
      if (!targetRole) return NextResponse.json({ error: "Role not found" }, { status: 404 });

      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: { roleId: targetRole.id, emailVerified: true },
        select: { id: true, name: true, email: true, role: { select: { id: true, name: true } }, createdAt: true },
      });
      await logAudit(session.user.id, "ADMIN_UPGRADED", "User", existing.id,
        `Upgraded ${email} to ${roleName}`);
      return NextResponse.json({ ...updated, createdAt: updated.createdAt.toISOString(), isUpgrade: true });
    }

    // Create new admin account
    const targetRole = await prisma.customRole.findUnique({ where: { name: roleName } });
    if (!targetRole) return NextResponse.json({ error: "Role not found" }, { status: 404 });

    const password = rawPassword?.trim() || crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(password, 12);
    const referralCode = generateReferralCode(name);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId: targetRole.id,
        referralCode,
        emailVerified: true,
      },
      select: { id: true, name: true, email: true, role: { select: { id: true, name: true } }, createdAt: true },
    });

    await logAudit(session.user.id, "ADMIN_CREATED", "User", user.id,
      `Created ${roleName} account for ${email}`);
    return NextResponse.json({
      ...user,
      createdAt: user.createdAt.toISOString(),
      tempPassword: rawPassword?.trim() ? undefined : password,
    }, { status: 201 });
  } catch (err) {
    console.error("[admin/admins POST]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
