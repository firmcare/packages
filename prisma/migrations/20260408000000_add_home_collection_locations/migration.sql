-- CreateTable
CREATE TABLE "HomeCollectionLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeCollectionLocation_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add the nullable FK column to Booking
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "homeCollectionLocationId" TEXT;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_homeCollectionLocationId_fkey"
    FOREIGN KEY ("homeCollectionLocationId")
    REFERENCES "HomeCollectionLocation"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
