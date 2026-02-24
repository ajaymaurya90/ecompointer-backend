-- AlterTable
ALTER TABLE "ProductCategory" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "ProductCategory_parentId_position_idx" ON "ProductCategory"("parentId", "position");
