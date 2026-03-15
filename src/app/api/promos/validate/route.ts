import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { code, packageId } = await req.json();

    if (!code || !packageId) {
      return new NextResponse("Code and packageId are required", { status: 400 });
    }

    const promo = await prisma.promo.findUnique({
      where: { code },
      include: {
        packages: { where: { packageId } },
      },
    });

    if (!promo) {
      return NextResponse.json({ valid: false, message: "Invalid promo code" });
    }

    if (!promo.isActive) {
      return NextResponse.json({ valid: false, message: "Promo code is inactive" });
    }

    const now = new Date();
    if (now < promo.validFrom || now > promo.validUntil) {
      return NextResponse.json({ valid: false, message: "Promo code has expired" });
    }

    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      return NextResponse.json({ valid: false, message: "Promo code usage limit reached" });
    }

    if (!promo.applyToAll && promo.packages.length === 0) {
      return NextResponse.json({ valid: false, message: "Promo code not valid for this package" });
    }

    return NextResponse.json({
      valid: true,
      promo: {
        id: promo.id,
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minAmount: promo.minAmount,
        maxDiscount: promo.maxDiscount,
      },
    });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
