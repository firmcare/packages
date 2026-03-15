import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const roleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    const canManageRoles = user?.role.permissions.some(
      rp => rp.permission.resource === 'roles' && rp.permission.action === 'create'
    );

    if (!canManageRoles) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { name, description, permissionIds } = roleSchema.parse(body);

    const role = await prisma.customRole.create({
      data: {
        name,
        description,
        isSystem: false,
        permissions: permissionIds ? {
          create: permissionIds.map(permId => ({ permissionId: permId })),
        } : undefined,
      },
      include: { permissions: { include: { permission: true } } },
    });

    return NextResponse.json(role);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const roles = await prisma.customRole.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });

    return NextResponse.json(roles);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
