-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brandOwnerId" TEXT;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
