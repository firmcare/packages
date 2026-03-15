import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    const canManageRoles = user?.role.permissions.some(
      rp => rp.permission.resource === 'roles' && rp.permission.action === 'update'
    );

    if (!canManageRoles) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const role = await prisma.customRole.findUnique({ where: { id } });
    if (!role) {
      return new NextResponse("Role not found", { status: 404 });
    }

    if (role.isSystem) {
      return new NextResponse("Cannot modify system roles", { status: 400 });
    }

    const body = await req.json();
    const { name, description, permissionIds } = updateRoleSchema.parse(body);

    if (permissionIds) {
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    }

    const updatedRole = await prisma.customRole.update({
      where: { id },
      data: {
        name,
        description,
        permissions: permissionIds ? {
          create: permissionIds.map(permId => ({ permissionId: permId })),
        } : undefined,
      },
      include: { permissions: { include: { permission: true } } },
    });

    return NextResponse.json(updatedRole);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    const canManageRoles = user?.role.permissions.some(
      rp => rp.permission.resource === 'roles' && rp.permission.action === 'delete'
    );

    if (!canManageRoles) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const role = await prisma.customRole.findUnique({ where: { id } });
    if (!role) {
      return new NextResponse("Role not found", { status: 404 });
    }

    if (role.isSystem) {
      return new NextResponse("Cannot delete system roles", { status: 400 });
    }

    await prisma.customRole.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
