-- AlterTable
ALTER TABLE "Promo" ADD COLUMN     "applyToAll" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PromoPackage" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoPackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoPackage_promoId_packageId_key" ON "PromoPackage"("promoId", "packageId");

-- AddForeignKey
ALTER TABLE "PromoPackage" ADD CONSTRAINT "PromoPackage_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoPackage" ADD CONSTRAINT "PromoPackage_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;
