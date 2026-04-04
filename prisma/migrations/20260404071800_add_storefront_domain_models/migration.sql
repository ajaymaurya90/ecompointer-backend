-- DropIndex
DROP INDEX "BrandOwnerStorefrontSetting_brandOwnerId_idx";

-- DropIndex
DROP INDEX "BrandOwnerStorefrontTheme_brandOwnerId_idx";

-- AlterTable
ALTER TABLE "BrandOwnerStorefrontSetting" ADD COLUMN     "aboutDescription" TEXT,
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "tagline" TEXT,
ALTER COLUMN "isStorefrontEnabled" SET DEFAULT false;

-- AlterTable
ALTER TABLE "CustomerAuth" ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "passwordUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BrandOwnerStorefrontDomain" (
    "id" TEXT NOT NULL,
    "brandOwnerId" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandOwnerStorefrontDomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrandOwnerStorefrontDomain_hostName_key" ON "BrandOwnerStorefrontDomain"("hostName");

-- CreateIndex
CREATE INDEX "BrandOwnerStorefrontDomain_brandOwnerId_isPrimary_idx" ON "BrandOwnerStorefrontDomain"("brandOwnerId", "isPrimary");

-- CreateIndex
CREATE INDEX "BrandOwnerStorefrontDomain_brandOwnerId_idx" ON "BrandOwnerStorefrontDomain"("brandOwnerId");

-- CreateIndex
CREATE INDEX "BrandOwnerStorefrontDomain_isActive_idx" ON "BrandOwnerStorefrontDomain"("isActive");

-- AddForeignKey
ALTER TABLE "BrandOwnerStorefrontDomain" ADD CONSTRAINT "BrandOwnerStorefrontDomain_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
