-- Rename the column and preserve existing data
ALTER TABLE "ProductBrand"
RENAME COLUMN "ownerId" TO "brandOwnerId";

-- Rename the index to match the new column name
ALTER INDEX "ProductBrand_ownerId_idx"
RENAME TO "ProductBrand_brandOwnerId_idx";

-- Rename the foreign key constraint to keep naming clean
ALTER TABLE "ProductBrand"
RENAME CONSTRAINT "ProductBrand_ownerId_fkey" TO "ProductBrand_brandOwnerId_fkey";