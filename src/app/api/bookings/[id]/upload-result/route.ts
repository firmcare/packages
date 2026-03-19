import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { uploadToS3, deleteFromS3 } from "@/lib/s3";
import { logBookingEvent } from "@/lib/booking-log";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        package: { select: { title: true } },
      },
    });

    if (!booking) {
      return new NextResponse("Booking not found", { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return new NextResponse("Only PDF files are allowed", { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return new NextResponse("File exceeds 5 MB limit", { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `results/${id}/${Date.now()}.pdf`;

    // Delete old result if one exists
    if (booking.resultPdfUrl) {
      deleteFromS3(booking.resultPdfUrl).catch(() => {});
    }

    await uploadToS3(key, buffer, "application/pdf");

    // Update booking with new S3 key only — notification happens on Save Changes
    const updated = await prisma.booking.update({
      where: { id },
      data: { resultPdfUrl: key },
    });

    const actorName = (session.user as any).name || session.user.email || "Admin";
    await logBookingEvent(id, "PDF_UPLOADED", `Result PDF uploaded by ${actorName}`, actorName);

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Upload result error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
