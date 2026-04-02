-- AlterTable
ALTER TABLE "BrandOwner" ADD COLUMN     "allowBelowMinLineQtyAfterCartMin" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "minShopOrderCartQty" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "minShopOrderLineQty" INTEGER NOT NULL DEFAULT 3;
