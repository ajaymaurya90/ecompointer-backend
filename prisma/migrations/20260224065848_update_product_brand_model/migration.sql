-- CreateEnum
CREATE TYPE "BrandStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "ProductBrand" ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "status" "BrandStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "tagline" TEXT;
