/*
  Warnings:

  - You are about to drop the column `mrp` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `wholesalePrice` on the `ProductVariant` table. All the data in the column will be lost.
  - Added the required column `costPrice` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `retailGross` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `retailNet` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxRate` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wholesaleGross` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wholesaleNet` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_brandId_fkey";

-- DropIndex
DROP INDEX "Product_brandId_idx";

-- DropIndex
DROP INDEX "Product_categoryId_idx";

-- DropIndex
DROP INDEX "ProductVariant_productId_idx";

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "mrp",
DROP COLUMN "wholesalePrice",
ADD COLUMN     "costPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "retailGross" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "retailNet" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "taxRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "wholesaleGross" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "wholesaleNet" DOUBLE PRECISION NOT NULL;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ProductBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
