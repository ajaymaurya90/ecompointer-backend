/*
  Warnings:

  - Made the column `brandOwnerId` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_brandOwnerId_fkey";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "brandOwnerId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
