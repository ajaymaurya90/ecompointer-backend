/*
  Warnings:

  - A unique constraint covering the columns `[brandOwnerId,email]` on the table `CustomerAuth` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `brandOwnerId` to the `CustomerAuth` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CustomerAuth_email_key";

-- AlterTable
ALTER TABLE "CustomerAuth" ADD COLUMN     "brandOwnerId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "CustomerAuth_brandOwnerId_idx" ON "CustomerAuth"("brandOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAuth_brandOwnerId_email_key" ON "CustomerAuth"("brandOwnerId", "email");

-- AddForeignKey
ALTER TABLE "CustomerAuth" ADD CONSTRAINT "CustomerAuth_brandOwnerId_fkey" FOREIGN KEY ("brandOwnerId") REFERENCES "BrandOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
