-- CreateTable
CREATE TABLE "BrandOwnerStorefrontSetting" (
    "id" TEXT NOT NULL,
    "brandOwnerId" TEXT NOT NULL,
    "storefrontName" TEXT,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "supportEmail" TEXT,
    "supportPhone" TEXT,
    "isStorefrontEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isGuestCheckoutEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isCustomerRegistrationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "currencyCode" TEXT NOT NULL DEFAULT 'INR',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandOwnerStorefrontSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandOwnerStorefrontTheme" (
    "id" TEXT NOT NULL,
    "brandOwnerId" TEXT NOT NULL,
    "activeThemeCode" TEXT NOT NULL DEFAULT 'default',
    "isThemeActive" BOOLEAN NOT NULL DEFAULT true,
    "themeConfigJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandOwnerStorefrontTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAuth" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "refreshToken" TEXT,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAuth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrandOwnerStorefrontSetting_brandOwnerId_key" ON "BrandOwnerStorefrontSetting"("brandOwnerId");

-- CreateIndex
CREATE INDEX "BrandOwnerStorefrontSetting_brandOwnerId_idx" ON "BrandOwnerStorefrontSetting"("brandOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandOwnerStorefrontTheme_brandOwnerId_key" ON "BrandOwnerStorefrontTheme"("brandOwnerId");

-- CreateIndex
CREATE INDEX "BrandOwnerStorefrontTheme_brandOwnerId_idx" ON "BrandOwnerStorefrontTheme"("brandOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAuth_customerId_key" ON "CustomerAuth"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAuth_email_key" ON "CustomerAuth"("email");

-- CreateIndex
CREATE INDEX "CustomerAuth_customerId_idx" ON "CustomerAuth"("customerId");

-- CreateIndex
CREATE INDEX "CustomerAuth_email_idx" ON "CustomerAuth"("email");

-- AddForeignKey
ALTER TABLE "BrandOwnerStorefrontSetting" ADD CONSTRAINT "BrandOwnerStorefrontSetting_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandOwnerStorefrontTheme" ADD CONSTRAINT "BrandOwnerStorefrontTheme_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAuth" ADD CONSTRAINT "CustomerAuth_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
