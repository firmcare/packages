import { prisma } from "@/lib/prisma";

export async function logBookingEvent(
  bookingId: string,
  event: string,
  note: string,
  actorName: string
) {
  await prisma.bookingLog.create({
    data: { bookingId, event, note, actorName },
  });
}
