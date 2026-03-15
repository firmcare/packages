import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

  const rewards = await prisma.referralReward.findMany({
    where: { referrerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      referee: { select: { name: true, email: true } },
      booking: {
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
          package: { select: { title: true } },
        },
      },
    },
  });

  return NextResponse.json(rewards);
}
