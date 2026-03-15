import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const testSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const test = await prisma.test.findUnique({
      where: { id },
    });

    if (!test) {
      return new NextResponse("Test not found", { status: 404 });
    }

    return NextResponse.json(test);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = testSchema.parse(body);

    const test = await prisma.test.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(test);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await prisma.test.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
