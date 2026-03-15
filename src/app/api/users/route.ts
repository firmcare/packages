import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    const canManageUsers = currentUser?.role.permissions.some(
      rp => rp.permission.resource === 'users' && rp.permission.action === 'read'
    );

    if (!canManageUsers) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const isSuperAdmin = currentUser?.role.name === 'SUPERADMIN';

    const users = await prisma.user.findMany({
      where: isSuperAdmin ? {} : {
        role: { name: { not: 'SUPERADMIN' } }
      },
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

    return NextResponse.json(users);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
