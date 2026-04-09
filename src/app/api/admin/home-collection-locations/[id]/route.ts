import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function isAdmin(role?: string | null) {
  return role === "ADMIN" || role === "SUPERADMIN";
}

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  price: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!isAdmin(session?.user?.role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const location = await prisma.homeCollectionLocation.update({
      where: { id },
      data,
    });
    return NextResponse.json(location);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    console.error("Error updating location:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!isAdmin(session?.user?.role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = await params;

    // Check if any bookings reference this location
    const used = await prisma.booking.count({ where: { homeCollectionLocationId: id } });
    if (used > 0) {
      // Soft-delete by deactivating instead
      const location = await prisma.homeCollectionLocation.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ ...location, deactivated: true });
    }

    await prisma.homeCollectionLocation.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting location:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
