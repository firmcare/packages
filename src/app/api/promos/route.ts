import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const promoSchema = z.object({
  code: z.string().min(1),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().min(0),
  minAmount: z.number().min(0).optional().nullable(),
  maxDiscount: z.number().min(0).optional().nullable(),
  validFrom: z.string(),
  validUntil: z.string(),
  usageLimit: z.number().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
  applyToAll: z.boolean().default(false),
  packageIds: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { packageIds, ...validatedData } = promoSchema.parse(body);

    const promo = await prisma.promo.create({
      data: {
        ...validatedData,
        validFrom: new Date(validatedData.validFrom),
        validUntil: new Date(validatedData.validUntil),
      },
    });

    if (packageIds && !validatedData.applyToAll) {
      await prisma.$transaction(
        packageIds.map(packageId => 
          prisma.promoPackage.create({
            data: { promoId: promo.id, packageId }
          })
        )
      );
    }

    const promoWithPackages = await prisma.promo.findUnique({
      where: { id: promo.id },
      include: {
        packages: { include: { package: { select: { title: true } } } },
      },
    });

    await logAudit(session.user.id, "PROMO_CREATED", "Promo", promo.id, `Created promo "${promo.code}"`, {
      resourceName: promo.code,
      metadata: { discountType: validatedData.discountType, discountValue: validatedData.discountValue, applyToAll: validatedData.applyToAll },
    });

    return NextResponse.json(promoWithPackages);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const promos = await prisma.promo.findMany({
      include: {
        packages: { include: { package: { select: { id: true, title: true } } } },
        _count: { select: { transactions: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(promos);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

