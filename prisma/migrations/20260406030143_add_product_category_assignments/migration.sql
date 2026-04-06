-- CreateTable
CREATE TABLE "ProductCategoryAssignment" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategoryAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductCategoryAssignment_productId_idx" ON "ProductCategoryAssignment"("productId");

-- CreateIndex
CREATE INDEX "ProductCategoryAssignment_categoryId_idx" ON "ProductCategoryAssignment"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategoryAssignment_productId_categoryId_key" ON "ProductCategoryAssignment"("productId", "categoryId");

-- CreateIndex
CREATE INDEX "Product_brandOwnerId_idx" ON "Product"("brandOwnerId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- AddForeignKey
ALTER TABLE "ProductCategoryAssignment" ADD CONSTRAINT "ProductCategoryAssignment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategoryAssignment" ADD CONSTRAINT "ProductCategoryAssignment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
