/*
  Warnings:

  - You are about to drop the column `description` on the `ProductCategory` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[brandId,name,parentId]` on the table `ProductCategory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `brandId` to the `ProductCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ProductCategory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProductCategory" DROP COLUMN "description",
ADD COLUMN     "brandId" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "ProductCategory_brandId_idx" ON "ProductCategory"("brandId");

-- CreateIndex
CREATE INDEX "ProductCategory_parentId_idx" ON "ProductCategory"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_brandId_name_parentId_key" ON "ProductCategory"("brandId", "name", "parentId");

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ProductBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
