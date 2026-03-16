import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "AGENT" && role !== "ADMIN" && role !== "SUPERADMIN")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const withdrawals = await prisma.withdrawalRequest.findMany({
    where: { agentId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      rewards: { select: { id: true, amount: true, bookingId: true } },
    },
  });

  return NextResponse.json(withdrawals);
}
