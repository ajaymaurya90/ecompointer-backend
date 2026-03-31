-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'BUSINESS', 'BOTH');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('LEAD', 'ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "CustomerSource" AS ENUM ('WEBSITE', 'MOBILE_APP', 'MANUAL', 'SHOP_REFERRAL', 'IMPORT', 'MARKETPLACE', 'OTHER');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('BILLING', 'SHIPPING', 'BOTH');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('SHOP_OWNER', 'DISTRIBUTOR', 'WHOLESALER', 'RESELLER', 'COMPANY', 'OTHER');

-- CreateEnum
CREATE TYPE "BuyerType" AS ENUM ('SHOP_OWNER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "SalesChannelType" AS ENUM ('DIRECT_WEBSITE', 'SHOP_ORDER', 'FRANCHISE_SHOP', 'MARKETPLACE', 'SOCIAL_MEDIA', 'MANUAL');

-- CreateEnum
CREATE TYPE "InventoryLocationType" AS ENUM ('WAREHOUSE', 'SHOP', 'FRANCHISE', 'MARKETPLACE_BUFFER', 'RETURNS', 'OTHER');

-- CreateEnum
CREATE TYPE "InventoryTransactionType" AS ENUM ('OPENING_STOCK', 'PURCHASE_IN', 'MANUAL_ADJUSTMENT', 'ORDER_RESERVED', 'ORDER_CONFIRMED', 'ORDER_CANCELLED', 'ORDER_RETURNED', 'TRANSFER_IN', 'TRANSFER_OUT', 'DAMAGED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'PARTIALLY_CONFIRMED';
ALTER TYPE "OrderStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "OrderStatus" ADD VALUE 'PARTIALLY_DISPATCHED';

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_brandOwnerId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_shopOwnerId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "buyerType" "BuyerType",
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "salesChannel" "SalesChannelType" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "shippingAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "subtotalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ALTER COLUMN "brandOwnerId" DROP NOT NULL,
ALTER COLUMN "shopOwnerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "orderSellerId" TEXT,
ADD COLUMN     "taxRate" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "ProductInventory" ADD COLUMN     "availableQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "locationId" TEXT,
ADD COLUMN     "reservedQuantity" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nativeName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneCode" TEXT,
    "currencyCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "State" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductBrandTranslations" (
    "id" TEXT NOT NULL,
    "productBrandId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "tagline" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductBrandTranslations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategoryTranslations" (
    "id" TEXT NOT NULL,
    "productCategoryId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategoryTranslations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTranslations" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "slug" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductTranslations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttributeTranslations" (
    "id" TEXT NOT NULL,
    "productAttributeId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAttributeTranslations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttributeValueTranslations" (
    "id" TEXT NOT NULL,
    "productAttributeValueId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAttributeValueTranslations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLocation" (
    "id" TEXT NOT NULL,
    "brandOwnerId" TEXT NOT NULL,
    "shopOwnerId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" "InventoryLocationType" NOT NULL DEFAULT 'WAREHOUSE',
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL,
    "brandOwnerId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "locationId" TEXT,
    "transactionType" "InventoryTransactionType" NOT NULL,
    "quantityChange" INTEGER NOT NULL,
    "balanceAfter" INTEGER,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "customerCode" TEXT NOT NULL,
    "brandOwnerId" TEXT NOT NULL,
    "type" "CustomerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "CustomerSource" NOT NULL DEFAULT 'MANUAL',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "alternatePhone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerBusiness" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "shopOwnerId" TEXT,
    "businessName" TEXT NOT NULL,
    "legalBusinessName" TEXT,
    "businessType" "BusinessType" NOT NULL DEFAULT 'OTHER',
    "contactPersonName" TEXT,
    "contactPersonPhone" TEXT,
    "contactPersonEmail" TEXT,
    "gstNumber" TEXT,
    "taxId" TEXT,
    "registrationNumber" TEXT,
    "website" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerBusiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAddress" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "AddressType" NOT NULL DEFAULT 'SHIPPING',
    "fullName" TEXT,
    "phone" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "landmark" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "countryId" TEXT,
    "stateId" TEXT,
    "districtId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerGroup" (
    "id" TEXT NOT NULL,
    "brandOwnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerGroupMember" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerGroupTranslations" (
    "id" TEXT NOT NULL,
    "customerGroupId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerGroupTranslations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderSeller" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "brandOwnerId" TEXT NOT NULL,
    "sellerOrderNumber" TEXT,
    "subtotalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shippingAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderSeller_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Language_code_key" ON "Language"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE INDEX "State_countryId_idx" ON "State"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "State_countryId_name_key" ON "State"("countryId", "name");

-- CreateIndex
CREATE INDEX "District_stateId_idx" ON "District"("stateId");

-- CreateIndex
CREATE UNIQUE INDEX "District_stateId_name_key" ON "District"("stateId", "name");

-- CreateIndex
CREATE INDEX "ProductBrandTranslations_productBrandId_idx" ON "ProductBrandTranslations"("productBrandId");

-- CreateIndex
CREATE INDEX "ProductBrandTranslations_languageId_idx" ON "ProductBrandTranslations"("languageId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBrandTranslations_productBrandId_languageId_key" ON "ProductBrandTranslations"("productBrandId", "languageId");

-- CreateIndex
CREATE INDEX "ProductCategoryTranslations_productCategoryId_idx" ON "ProductCategoryTranslations"("productCategoryId");

-- CreateIndex
CREATE INDEX "ProductCategoryTranslations_languageId_idx" ON "ProductCategoryTranslations"("languageId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategoryTranslations_productCategoryId_languageId_key" ON "ProductCategoryTranslations"("productCategoryId", "languageId");

-- CreateIndex
CREATE INDEX "ProductTranslations_productId_idx" ON "ProductTranslations"("productId");

-- CreateIndex
CREATE INDEX "ProductTranslations_languageId_idx" ON "ProductTranslations"("languageId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslations_productId_languageId_key" ON "ProductTranslations"("productId", "languageId");

-- CreateIndex
CREATE INDEX "ProductAttributeTranslations_productAttributeId_idx" ON "ProductAttributeTranslations"("productAttributeId");

-- CreateIndex
CREATE INDEX "ProductAttributeTranslations_languageId_idx" ON "ProductAttributeTranslations"("languageId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttributeTranslations_productAttributeId_languageId_key" ON "ProductAttributeTranslations"("productAttributeId", "languageId");

-- CreateIndex
CREATE INDEX "ProductAttributeValueTranslations_productAttributeValueId_idx" ON "ProductAttributeValueTranslations"("productAttributeValueId");

-- CreateIndex
CREATE INDEX "ProductAttributeValueTranslations_languageId_idx" ON "ProductAttributeValueTranslations"("languageId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttributeValueTranslations_productAttributeValueId_l_key" ON "ProductAttributeValueTranslations"("productAttributeValueId", "languageId");

-- CreateIndex
CREATE INDEX "InventoryLocation_brandOwnerId_idx" ON "InventoryLocation"("brandOwnerId");

-- CreateIndex
CREATE INDEX "InventoryLocation_shopOwnerId_idx" ON "InventoryLocation"("shopOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLocation_brandOwnerId_name_key" ON "InventoryLocation"("brandOwnerId", "name");

-- CreateIndex
CREATE INDEX "InventoryTransaction_brandOwnerId_idx" ON "InventoryTransaction"("brandOwnerId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_productVariantId_idx" ON "InventoryTransaction"("productVariantId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_locationId_idx" ON "InventoryTransaction"("locationId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_referenceType_referenceId_idx" ON "InventoryTransaction"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "Customer_brandOwnerId_idx" ON "Customer"("brandOwnerId");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_status_idx" ON "Customer"("status");

-- CreateIndex
CREATE INDEX "Customer_type_idx" ON "Customer"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_brandOwnerId_customerCode_key" ON "Customer"("brandOwnerId", "customerCode");

-- CreateIndex
CREATE INDEX "CustomerBusiness_customerId_idx" ON "CustomerBusiness"("customerId");

-- CreateIndex
CREATE INDEX "CustomerBusiness_shopOwnerId_idx" ON "CustomerBusiness"("shopOwnerId");

-- CreateIndex
CREATE INDEX "CustomerBusiness_businessName_idx" ON "CustomerBusiness"("businessName");

-- CreateIndex
CREATE INDEX "CustomerBusiness_gstNumber_idx" ON "CustomerBusiness"("gstNumber");

-- CreateIndex
CREATE INDEX "CustomerAddress_customerId_idx" ON "CustomerAddress"("customerId");

-- CreateIndex
CREATE INDEX "CustomerAddress_type_idx" ON "CustomerAddress"("type");

-- CreateIndex
CREATE INDEX "CustomerAddress_city_idx" ON "CustomerAddress"("city");

-- CreateIndex
CREATE INDEX "CustomerAddress_state_idx" ON "CustomerAddress"("state");

-- CreateIndex
CREATE INDEX "CustomerAddress_countryId_idx" ON "CustomerAddress"("countryId");

-- CreateIndex
CREATE INDEX "CustomerAddress_stateId_idx" ON "CustomerAddress"("stateId");

-- CreateIndex
CREATE INDEX "CustomerAddress_districtId_idx" ON "CustomerAddress"("districtId");

-- CreateIndex
CREATE INDEX "CustomerGroup_brandOwnerId_idx" ON "CustomerGroup"("brandOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerGroup_brandOwnerId_name_key" ON "CustomerGroup"("brandOwnerId", "name");

-- CreateIndex
CREATE INDEX "CustomerGroupMember_customerId_idx" ON "CustomerGroupMember"("customerId");

-- CreateIndex
CREATE INDEX "CustomerGroupMember_customerGroupId_idx" ON "CustomerGroupMember"("customerGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerGroupMember_customerId_customerGroupId_key" ON "CustomerGroupMember"("customerId", "customerGroupId");

-- CreateIndex
CREATE INDEX "CustomerGroupTranslations_customerGroupId_idx" ON "CustomerGroupTranslations"("customerGroupId");

-- CreateIndex
CREATE INDEX "CustomerGroupTranslations_languageId_idx" ON "CustomerGroupTranslations"("languageId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerGroupTranslations_customerGroupId_languageId_key" ON "CustomerGroupTranslations"("customerGroupId", "languageId");

-- CreateIndex
CREATE INDEX "OrderSeller_orderId_idx" ON "OrderSeller"("orderId");

-- CreateIndex
CREATE INDEX "OrderSeller_brandOwnerId_idx" ON "OrderSeller"("brandOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderSeller_orderId_brandOwnerId_key" ON "OrderSeller"("orderId", "brandOwnerId");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_buyerType_idx" ON "Order"("buyerType");

-- CreateIndex
CREATE INDEX "Order_salesChannel_idx" ON "Order"("salesChannel");

-- CreateIndex
CREATE INDEX "OrderItem_orderSellerId_idx" ON "OrderItem"("orderSellerId");

-- CreateIndex
CREATE INDEX "ProductInventory_locationId_idx" ON "ProductInventory"("locationId");

-- AddForeignKey
ALTER TABLE "State" ADD CONSTRAINT "State_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBrandTranslations" ADD CONSTRAINT "ProductBrandTranslations_productBrandId_fkey" FOREIGN KEY ("productBrandId") REFERENCES "ProductBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBrandTranslations" ADD CONSTRAINT "ProductBrandTranslations_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategoryTranslations" ADD CONSTRAINT "ProductCategoryTranslations_productCategoryId_fkey" FOREIGN KEY ("productCategoryId") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategoryTranslations" ADD CONSTRAINT "ProductCategoryTranslations_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTranslations" ADD CONSTRAINT "ProductTranslations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTranslations" ADD CONSTRAINT "ProductTranslations_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttributeTranslations" ADD CONSTRAINT "ProductAttributeTranslations_productAttributeId_fkey" FOREIGN KEY ("productAttributeId") REFERENCES "ProductAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttributeTranslations" ADD CONSTRAINT "ProductAttributeTranslations_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttributeValueTranslations" ADD CONSTRAINT "ProductAttributeValueTranslations_productAttributeValueId_fkey" FOREIGN KEY ("productAttributeValueId") REFERENCES "ProductAttributeValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttributeValueTranslations" ADD CONSTRAINT "ProductAttributeValueTranslations_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLocation" ADD CONSTRAINT "InventoryLocation_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLocation" ADD CONSTRAINT "InventoryLocation_shopOwnerId_fkey" FOREIGN KEY ("shopOwnerId") REFERENCES "ShopOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInventory" ADD CONSTRAINT "ProductInventory_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerBusiness" ADD CONSTRAINT "CustomerBusiness_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerBusiness" ADD CONSTRAINT "CustomerBusiness_shopOwnerId_fkey" FOREIGN KEY ("shopOwnerId") REFERENCES "ShopOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerGroup" ADD CONSTRAINT "CustomerGroup_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerGroupMember" ADD CONSTRAINT "CustomerGroupMember_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerGroupMember" ADD CONSTRAINT "CustomerGroupMember_customerGroupId_fkey" FOREIGN KEY ("customerGroupId") REFERENCES "CustomerGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerGroupTranslations" ADD CONSTRAINT "CustomerGroupTranslations_customerGroupId_fkey" FOREIGN KEY ("customerGroupId") REFERENCES "CustomerGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerGroupTranslations" ADD CONSTRAINT "CustomerGroupTranslations_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shopOwnerId_fkey" FOREIGN KEY ("shopOwnerId") REFERENCES "ShopOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSeller" ADD CONSTRAINT "OrderSeller_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSeller" ADD CONSTRAINT "OrderSeller_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderSellerId_fkey" FOREIGN KEY ("orderSellerId") REFERENCES "OrderSeller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
