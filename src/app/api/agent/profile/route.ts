import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  });
  const role = user?.role.name;
  if (!role || (role !== "AGENT" && role !== "ADMIN" && role !== "SUPERADMIN")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { name, phone, address } = await req.json();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name    !== undefined ? { name    } : {}),
      ...(phone   !== undefined ? { phone   } : {}),
      ...(address !== undefined ? { address } : {}),
    },
  });

  return NextResponse.json({ success: true });
}
