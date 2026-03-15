import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updatePromoSchema = z.object({
  code: z.string().min(1).optional(),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountValue: z.number().min(0).optional(),
  minAmount: z.number().min(0).optional().nullable(),
  maxDiscount: z.number().min(0).optional().nullable(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  usageLimit: z.number().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
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
    const validatedData = updatePromoSchema.parse(body);

    const promo = await prisma.promo.update({
      where: { id },
      data: {
        ...validatedData,
        ...(validatedData.validFrom && { validFrom: new Date(validatedData.validFrom) }),
        ...(validatedData.validUntil && { validUntil: new Date(validatedData.validUntil) }),
      },
    });

    return NextResponse.json(promo);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
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
    const { isActive } = body;

    const promo = await prisma.promo.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json(promo);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    await prisma.promo.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

