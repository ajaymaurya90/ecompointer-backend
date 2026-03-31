-- CreateTable
CREATE TABLE "BrandOwnerLanguage" (
    "id" TEXT NOT NULL,
    "brandOwnerId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandOwnerLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandOwnerCountry" (
    "id" TEXT NOT NULL,
    "brandOwnerId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandOwnerCountry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandOwnerState" (
    "id" TEXT NOT NULL,
    "brandOwnerId" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandOwnerState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandOwnerDistrict" (
    "id" TEXT NOT NULL,
    "brandOwnerId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandOwnerDistrict_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrandOwnerLanguage_languageId_idx" ON "BrandOwnerLanguage"("languageId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandOwnerLanguage_brandOwnerId_languageId_key" ON "BrandOwnerLanguage"("brandOwnerId", "languageId");

-- CreateIndex
CREATE INDEX "BrandOwnerCountry_brandOwnerId_idx" ON "BrandOwnerCountry"("brandOwnerId");

-- CreateIndex
CREATE INDEX "BrandOwnerCountry_countryId_idx" ON "BrandOwnerCountry"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandOwnerCountry_brandOwnerId_countryId_key" ON "BrandOwnerCountry"("brandOwnerId", "countryId");

-- CreateIndex
CREATE INDEX "BrandOwnerState_brandOwnerId_idx" ON "BrandOwnerState"("brandOwnerId");

-- CreateIndex
CREATE INDEX "BrandOwnerState_stateId_idx" ON "BrandOwnerState"("stateId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandOwnerState_brandOwnerId_stateId_key" ON "BrandOwnerState"("brandOwnerId", "stateId");

-- CreateIndex
CREATE INDEX "BrandOwnerDistrict_brandOwnerId_idx" ON "BrandOwnerDistrict"("brandOwnerId");

-- CreateIndex
CREATE INDEX "BrandOwnerDistrict_districtId_idx" ON "BrandOwnerDistrict"("districtId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandOwnerDistrict_brandOwnerId_districtId_key" ON "BrandOwnerDistrict"("brandOwnerId", "districtId");

-- AddForeignKey
ALTER TABLE "BrandOwnerLanguage" ADD CONSTRAINT "BrandOwnerLanguage_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandOwnerLanguage" ADD CONSTRAINT "BrandOwnerLanguage_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandOwnerCountry" ADD CONSTRAINT "BrandOwnerCountry_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandOwnerCountry" ADD CONSTRAINT "BrandOwnerCountry_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandOwnerState" ADD CONSTRAINT "BrandOwnerState_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandOwnerState" ADD CONSTRAINT "BrandOwnerState_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandOwnerDistrict" ADD CONSTRAINT "BrandOwnerDistrict_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandOwnerDistrict" ADD CONSTRAINT "BrandOwnerDistrict_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;
