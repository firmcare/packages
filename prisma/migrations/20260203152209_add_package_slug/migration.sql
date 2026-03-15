/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Package` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Package` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add slug column as nullable first
ALTER TABLE "Package" ADD COLUMN "slug" TEXT;

-- Update existing rows with slugs generated from titles
UPDATE "Package" SET "slug" =
  LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );

-- Make slug NOT NULL
ALTER TABLE "Package" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Package_slug_key" ON "Package"("slug");
