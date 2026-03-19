import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { code, packageId, packageIds, isCustomPackage } = await req.json();

    if (!code) {
      return new NextResponse("Code is required", { status: 400 });
    }

    // Support both single packageId (legacy) and packageIds array
    const allPackageIds: string[] = packageIds
      ? packageIds
      : packageId
      ? [packageId]
      : [];

    if (allPackageIds.length === 0 && !isCustomPackage) {
      return new NextResponse("packageId or isCustomPackage is required", { status: 400 });
    }

    const promo = await prisma.promo.findUnique({
      where: { code },
      include: {
        packages: allPackageIds.length > 0
          ? { where: { packageId: { in: allPackageIds } }, include: { package: { select: { id: true, title: true } } } }
          : { include: { package: { select: { id: true, title: true } } } },
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

    // For custom packages, only apply if the promo is set to apply to all
    if (isCustomPackage && !promo.applyToAll) {
      return NextResponse.json({ valid: false, message: "Promo code not valid for custom packages" });
    }

    if (!isCustomPackage && !promo.applyToAll && promo.packages.length === 0) {
      return NextResponse.json({ valid: false, message: "Promo code not valid for this package" });
    }

    // Determine which package IDs from the cart this promo applies to
    const applicablePackageIds: string[] = promo.applyToAll
      ? allPackageIds
      : promo.packages.map((p) => p.packageId);

    return NextResponse.json({
      valid: true,
      promo: {
        id: promo.id,
        code: promo.code,
        discountType: promo.discountType,
        discountValue: Number(promo.discountValue),
        minAmount: promo.minAmount ? Number(promo.minAmount) : null,
        maxDiscount: promo.maxDiscount ? Number(promo.maxDiscount) : null,
        applyToAll: promo.applyToAll,
        applicablePackageIds,
      },
    });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
