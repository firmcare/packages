import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function isAdmin(role?: string | null) {
  return role === "ADMIN" || role === "SUPERADMIN";
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const session = await auth();
    if (!isAdmin(session?.user?.role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const locations = await prisma.homeCollectionLocation.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!isAdmin(session?.user?.role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const data = createSchema.parse(body);

    const location = await prisma.homeCollectionLocation.create({
      data: { name: data.name, price: data.price, isActive: data.isActive },
    });
    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    console.error("Error creating location:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
