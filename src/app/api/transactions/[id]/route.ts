import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateTransactionSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = updateTransactionSchema.parse(body);

    const transaction = await prisma.transaction.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { name: true, email: true } },
        booking: { select: { id: true, date: true } },
        promo: { select: { code: true } },
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        booking: { select: { id: true, date: true } },
        promo: { select: { code: true } },
      },
    });

    if (!transaction) {
      return new NextResponse("Transaction not found", { status: 404 });
    }

    return NextResponse.json(transaction);
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
