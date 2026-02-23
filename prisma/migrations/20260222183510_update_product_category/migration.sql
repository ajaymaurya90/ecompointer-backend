/*
  Warnings:

  - You are about to drop the column `brandId` on the `ProductCategory` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[brandOwnerId,name,parentId]` on the table `ProductCategory` will be added. If there are existing duplicate values, this will fail.
  - Made the column `brandOwnerId` on table `ProductCategory` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ProductCategory" DROP CONSTRAINT "ProductCategory_brandId_fkey";

-- DropForeignKey
ALTER TABLE "ProductCategory" DROP CONSTRAINT "ProductCategory_brandOwnerId_fkey";

-- DropIndex
DROP INDEX "ProductCategory_brandId_idx";

-- DropIndex
DROP INDEX "ProductCategory_brandId_name_parentId_key";

-- AlterTable
ALTER TABLE "ProductCategory" DROP COLUMN "brandId",
ALTER COLUMN "brandOwnerId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "ProductCategory_brandOwnerId_idx" ON "ProductCategory"("brandOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_brandOwnerId_name_parentId_key" ON "ProductCategory"("brandOwnerId", "name", "parentId");

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
