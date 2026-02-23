-- AlterTable
ALTER TABLE "ProductCategory" ADD COLUMN     "brandOwnerId" TEXT,
ADD COLUMN     "description" TEXT;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
