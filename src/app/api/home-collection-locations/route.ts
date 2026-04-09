import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const locations = await prisma.homeCollectionLocation.findMany({
      where: { isActive: true },
      select: { id: true, name: true, price: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching home collection locations:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
