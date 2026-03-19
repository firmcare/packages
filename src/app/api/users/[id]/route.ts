import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const updateUserSchema = z.object({
  roleId: z.string(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    const canManageUsers = currentUser?.role.permissions.some(
      rp => rp.permission.resource === 'users' && rp.permission.action === 'update'
    );

    if (!canManageUsers) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!targetUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    const isSuperAdmin = currentUser?.role.name === 'SUPERADMIN';
    const isAdmin = currentUser?.role.name === 'ADMIN';

    if (targetUser.role.name === 'SUPERADMIN' && !isSuperAdmin) {
      return new NextResponse("Only SUPERADMIN can manage SUPERADMIN users", { status: 403 });
    }

    if (targetUser.role.name === 'ADMIN' && !isSuperAdmin) {
      return new NextResponse("Only SUPERADMIN can manage ADMIN users", { status: 403 });
    }

    const body = await req.json();
    const { roleId } = updateUserSchema.parse(body);

    const newRole = await prisma.customRole.findUnique({ where: { id: roleId } });
    if (!newRole) {
      return new NextResponse("Role not found", { status: 404 });
    }

    if ((newRole.name === 'SUPERADMIN' || newRole.name === 'ADMIN') && !isSuperAdmin) {
      return new NextResponse("Only SUPERADMIN can assign ADMIN or SUPERADMIN roles", { status: 403 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { roleId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        referralCode: true,
        createdAt: true,
      },
    });

    await logAudit(session.user.id, "USER_ROLE_CHANGE", "User", id,
      `Changed role of ${targetUser.name ?? targetUser.email} from ${targetUser.role.name} to ${newRole.name}`);

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
