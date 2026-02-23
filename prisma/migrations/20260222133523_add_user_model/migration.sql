/*
  Warnings:

  - You are about to drop the column `email` on the `BrandOwner` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `BrandOwner` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `BrandOwner` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `BrandOwner` table. All the data in the column will be lost.
  - You are about to drop the column `tokenVersion` on the `BrandOwner` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `BrandOwner` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `ShopOwner` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "BrandOwner_email_idx";

-- DropIndex
DROP INDEX "BrandOwner_email_key";

-- AlterTable
ALTER TABLE "BrandOwner" DROP COLUMN "email",
DROP COLUMN "password",
DROP COLUMN "refreshToken",
DROP COLUMN "role",
DROP COLUMN "tokenVersion",
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "ShopOwner" ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "refreshToken" TEXT,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BrandOwner_userId_key" ON "BrandOwner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopOwner_userId_key" ON "ShopOwner"("userId");

-- AddForeignKey
ALTER TABLE "BrandOwner" ADD CONSTRAINT "BrandOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopOwner" ADD CONSTRAINT "ShopOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
