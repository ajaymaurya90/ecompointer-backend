-- AlterTable
ALTER TABLE "BrandOwner" ADD COLUMN     "countryId" TEXT,
ADD COLUMN     "districtId" TEXT,
ADD COLUMN     "stateId" TEXT;

-- AddForeignKey
ALTER TABLE "BrandOwner" ADD CONSTRAINT "BrandOwner_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandOwner" ADD CONSTRAINT "BrandOwner_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandOwner" ADD CONSTRAINT "BrandOwner_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
