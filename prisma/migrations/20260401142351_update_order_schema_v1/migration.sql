/*
  Warnings:

  - You are about to drop the column `priceAtOrder` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `OrderItem` table. All the data in the column will be lost.
  - Added the required column `billingAddressLine1` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `billingCity` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyerName` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingAddressLine1` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingCity` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Made the column `brandOwnerId` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `buyerType` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `brandOwnerId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productName` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variantSku` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE', 'CREDIT', 'OTHER');

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_brandOwnerId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "billingAddressLine1" TEXT NOT NULL,
ADD COLUMN     "billingAddressLine2" TEXT,
ADD COLUMN     "billingCity" TEXT NOT NULL,
ADD COLUMN     "billingCountry" TEXT,
ADD COLUMN     "billingDistrict" TEXT,
ADD COLUMN     "billingFullName" TEXT,
ADD COLUMN     "billingLandmark" TEXT,
ADD COLUMN     "billingPhone" TEXT,
ADD COLUMN     "billingPostalCode" TEXT,
ADD COLUMN     "billingState" TEXT,
ADD COLUMN     "buyerEmail" TEXT,
ADD COLUMN     "buyerName" TEXT NOT NULL,
ADD COLUMN     "buyerPhone" TEXT,
ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "shippingAddressLine1" TEXT NOT NULL,
ADD COLUMN     "shippingAddressLine2" TEXT,
ADD COLUMN     "shippingCity" TEXT NOT NULL,
ADD COLUMN     "shippingCountry" TEXT,
ADD COLUMN     "shippingDistrict" TEXT,
ADD COLUMN     "shippingFullName" TEXT,
ADD COLUMN     "shippingLandmark" TEXT,
ADD COLUMN     "shippingPhone" TEXT,
ADD COLUMN     "shippingPostalCode" TEXT,
ADD COLUMN     "shippingState" TEXT,
ALTER COLUMN "brandOwnerId" SET NOT NULL,
ALTER COLUMN "totalAmount" SET DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'PENDING',
ALTER COLUMN "paymentStatus" SET DEFAULT 'UNPAID',
ALTER COLUMN "buyerType" SET NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "priceAtOrder",
DROP COLUMN "totalPrice",
ADD COLUMN     "brandOwnerId" TEXT NOT NULL,
ADD COLUMN     "lineSubtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "lineTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "productCode" TEXT,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "productName" TEXT NOT NULL,
ADD COLUMN     "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "unitPrice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "variantLabel" TEXT,
ADD COLUMN     "variantSku" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OrderPayment" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
ADD COLUMN     "referenceNo" TEXT;

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_brandOwnerId_idx" ON "OrderItem"("brandOwnerId");

-- CreateIndex
CREATE INDEX "OrderPayment_paymentDate_idx" ON "OrderPayment"("paymentDate");

-- CreateIndex
CREATE INDEX "OrderSeller_status_idx" ON "OrderSeller"("status");

-- CreateIndex
CREATE INDEX "OrderSeller_paymentStatus_idx" ON "OrderSeller"("paymentStatus");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
