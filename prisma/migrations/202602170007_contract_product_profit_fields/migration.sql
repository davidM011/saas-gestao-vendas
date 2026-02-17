-- Backfill safety before contract
UPDATE "Product"
SET
  "costPrice" = COALESCE("costPrice", 0),
  "salePrice" = COALESCE("salePrice", "price");

UPDATE "SaleItem" si
SET
  "unitPrice" = COALESCE(si."unitPrice", si."price"),
  "unitCost" = COALESCE(si."unitCost", p."costPrice", 0)
FROM "Product" p
WHERE si."productId" = p."id";

UPDATE "SaleItem"
SET
  "unitPrice" = COALESCE("unitPrice", "price"),
  "unitCost" = COALESCE("unitCost", 0);

-- Contract Product
ALTER TABLE "Product" ALTER COLUMN "costPrice" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "salePrice" SET NOT NULL;
ALTER TABLE "Product" DROP COLUMN "price";

-- Contract SaleItem
ALTER TABLE "SaleItem" ALTER COLUMN "unitPrice" SET NOT NULL;
ALTER TABLE "SaleItem" ALTER COLUMN "unitCost" SET NOT NULL;
ALTER TABLE "SaleItem" DROP COLUMN "price";
