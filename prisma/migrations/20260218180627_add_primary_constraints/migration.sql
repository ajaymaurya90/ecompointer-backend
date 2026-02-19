/*
  Warnings:

  - A unique constraint covering the columns `[productId,isPrimary]` on the table `Media` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[variantId,isPrimary]` on the table `Media` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "unique_product_primary" ON "Media"("productId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "unique_variant_primary" ON "Media"("variantId", "isPrimary");
