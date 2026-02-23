/*
  Warnings:

  - You are about to drop the column `ountry` on the `BrandOwner` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BrandOwner" DROP COLUMN "ountry",
ADD COLUMN     "country" TEXT,
ADD COLUMN     "state" TEXT;
