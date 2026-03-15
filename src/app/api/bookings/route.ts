
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkPermission } from "@/lib/permissions";

const bookingSchema = z.object({
  packageId: z.string().min(1),
  date: z.string().datetime(), // ISO string
  homeCollection: z.boolean().default(false),
  totalAmount: z.number().min(0),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'bookings', 'create');
    if (!hasPermission) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const validatedData = bookingSchema.parse(body);

    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        packageId: validatedData.packageId,
        date: new Date(validatedData.date),
        homeCollection: validatedData.homeCollection,
        totalAmount: validatedData.totalAmount,
        status: "PENDING",
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
         return new NextResponse("Unauthorized", { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'bookings', 'read');
    if (!hasPermission) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    const where = (user?.role.name === 'ADMIN' || user?.role.name === 'SUPERADMIN') ? {} : { userId: session.user.id };

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
            select: { name: true, email: true, phone: true }
        },
        package: true,
      },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(bookings);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
