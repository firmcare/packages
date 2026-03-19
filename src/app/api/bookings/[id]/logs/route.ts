import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const logs = await prisma.bookingLog.findMany({
      where: { bookingId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(logs);
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
