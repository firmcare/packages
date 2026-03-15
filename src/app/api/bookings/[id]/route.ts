import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createNotification, STATUS_NOTIFICATION } from "@/lib/notify";

const VALID_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SAMPLE_COLLECTED",
  "IN_PROGRESS",
  "RESULTS_READY",
  "COMPLETED",
  "CANCELLED",
] as const;

const updateBookingSchema = z.object({
  status: z.enum(VALID_STATUSES).optional(),
  notes: z.string().optional().or(z.literal("")),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = updateBookingSchema.parse(body);

    const existing = await prisma.booking.findUnique({
      where: { id },
      include: { package: { select: { title: true } } },
    });

    if (!existing) {
      return new NextResponse("Booking not found", { status: 404 });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...(validatedData.status && { status: validatedData.status }),
        notes: validatedData.notes !== undefined ? validatedData.notes || null : undefined,
      },
    });

    // In-app notification for the user on status change
    const newStatus = validatedData.status;
    if (newStatus && newStatus !== existing.status) {
      const tpl = STATUS_NOTIFICATION[newStatus];
      if (tpl) {
        createNotification({
          userId: existing.userId,
          type: newStatus === "RESULTS_READY" ? "results_ready" : "status_update",
          title: tpl.title,
          message: tpl.message(existing.package.title),
          bookingId: id,
        });
      }
    }

    return NextResponse.json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

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
      include: {
        user: { select: { name: true, email: true, phone: true } },
        package: true,
      },
    });

    if (!booking) {
      return new NextResponse("Booking not found", { status: 404 });
    }

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUPERADMIN" &&
      booking.userId !== session.user.id
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
