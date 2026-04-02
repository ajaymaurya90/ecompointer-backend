/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `ShopOwner` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `ShopOwner` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `BrandOwnerShop` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BrandOwnerShop" ADD COLUMN     "linkedByUserId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ShopOwner" ADD COLUMN     "businessName" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "gstNumber" TEXT,
ADD COLUMN     "legalEntityName" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "state" TEXT;

-- CreateIndex
CREATE INDEX "BrandOwnerShop_isActive_idx" ON "BrandOwnerShop"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ShopOwner_phone_key" ON "ShopOwner"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "ShopOwner_email_key" ON "ShopOwner"("email");

-- CreateIndex
CREATE INDEX "ShopOwner_shopName_idx" ON "ShopOwner"("shopName");

-- CreateIndex
CREATE INDEX "ShopOwner_ownerName_idx" ON "ShopOwner"("ownerName");

-- CreateIndex
CREATE INDEX "ShopOwner_isActive_idx" ON "ShopOwner"("isActive");
