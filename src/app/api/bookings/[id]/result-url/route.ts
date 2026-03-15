import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getPresignedUrl } from "@/lib/s3";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { userId: true, resultPdfUrl: true },
    });

    if (!booking) {
      return new NextResponse("Booking not found", { status: 404 });
    }

    // Users can only get their own result; admins can get any
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUPERADMIN" &&
      booking.userId !== session.user.id
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (!booking.resultPdfUrl) {
      return new NextResponse("No result available", { status: 404 });
    }

    // Presigned URL valid for 15 minutes
    const url = await getPresignedUrl(booking.resultPdfUrl, 900);
    return NextResponse.json({ url });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
