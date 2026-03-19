import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createNotification, isNotifEnabled, STATUS_NOTIFICATION, STATUS_NOTIFY_KEY } from "@/lib/notify";
import { logAudit } from "@/lib/audit";
import { sendBookingStatusEmail, sendResultsReadyEmail } from "@/lib/email";
import { getPresignedUrl } from "@/lib/s3";
import { logBookingEvent } from "@/lib/booking-log";

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
      include: {
        package: { select: { title: true } },
        user: { select: { name: true, email: true } },
      },
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
        const notifKey = STATUS_NOTIFY_KEY[newStatus];
        const notifEnabled = notifKey ? await isNotifEnabled(notifKey) : true;
        if (notifEnabled) {
          createNotification({
            userId: existing.userId,
            type: newStatus === "RESULTS_READY" ? "results_ready" : "status_update",
            title: tpl.title,
            message: tpl.message(existing.package.title),
            bookingId: id,
          });
        }
      }

      // Auto-confirm referral rewards when booking is COMPLETED
      if (newStatus === "COMPLETED") {
        await prisma.referralReward.updateMany({
          where: { bookingId: id, status: "PENDING" },
          data: { status: "CONFIRMED" },
        });
      }

      // Cancel pending rewards if booking is CANCELLED
      if (newStatus === "CANCELLED") {
        await prisma.referralReward.updateMany({
          where: { bookingId: id, status: "PENDING" },
          data: { status: "CANCELLED" },
        });
      }

      // Email notification (non-blocking)
      if (existing.user.email) {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        if (newStatus === "RESULTS_READY" && booking.resultPdfUrl) {
          getPresignedUrl(booking.resultPdfUrl, 900)
            .then((presignedUrl) =>
              sendResultsReadyEmail(
                existing.user.email!,
                existing.user.name,
                existing.package.title,
                existing.date,
                presignedUrl,
                baseUrl
              )
            )
            .catch(() => {});
        } else {
          sendBookingStatusEmail(
            existing.user.email,
            existing.user.name,
            existing.package.title,
            newStatus,
            existing.date,
            validatedData.notes ?? existing.notes,
            baseUrl
          ).catch(() => {});
        }
      }
    }

    const actorName = session.user.name || session.user.email || "Admin";

    if (validatedData.status && validatedData.status !== existing.status) {
      await logAudit(session.user.id, "BOOKING_STATUS_UPDATE", "Booking", id,
        `Status: ${existing.status} → ${validatedData.status} (${existing.package.title})`);
      const statusLabel: Record<string, string> = {
        CONFIRMED: "Confirmed", SAMPLE_COLLECTED: "Sample collected",
        IN_PROGRESS: "Test in progress", RESULTS_READY: "Results ready",
        COMPLETED: "Completed", CANCELLED: "Cancelled",
      };
      const label = statusLabel[validatedData.status] ?? validatedData.status;
      await logBookingEvent(id, "STATUS_CHANGED", `${label} by ${actorName}`, actorName);
    } else if (validatedData.notes !== undefined) {
      await logAudit(session.user.id, "BOOKING_NOTES_UPDATE", "Booking", id,
        `Updated notes for ${existing.package.title}`);
      await logBookingEvent(id, "NOTES_UPDATED", `Notes updated by ${actorName}`, actorName);
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
