-- AlterEnum
ALTER TYPE "MediaType" ADD VALUE 'VIDEO';

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "size" INTEGER;
