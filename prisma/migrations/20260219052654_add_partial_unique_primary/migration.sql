-- DropIndex
DROP INDEX "unique_product_primary";

-- DropIndex
DROP INDEX "unique_variant_primary";

-- Product primary constraint
CREATE UNIQUE INDEX unique_product_primary_true
ON "Media" ("productId")
WHERE "isPrimary" = true AND "productId" IS NOT NULL;

-- Variant primary constraint
CREATE UNIQUE INDEX unique_variant_primary_true
ON "Media" ("variantId")
WHERE "isPrimary" = true AND "variantId" IS NOT NULL;

