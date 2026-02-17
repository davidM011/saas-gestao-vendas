-- AddColumn (nullable first to allow backfill)
ALTER TABLE "SaleItem" ADD COLUMN "tenantId" TEXT;

-- Backfill tenantId from related Sale
UPDATE "SaleItem" si
SET "tenantId" = s."tenantId"
FROM "Sale" s
WHERE si."saleId" = s."id";

-- Enforce not null
ALTER TABLE "SaleItem" ALTER COLUMN "tenantId" SET NOT NULL;

-- Index and FK
CREATE INDEX "SaleItem_tenantId_idx" ON "SaleItem"("tenantId");

ALTER TABLE "SaleItem"
ADD CONSTRAINT "SaleItem_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;