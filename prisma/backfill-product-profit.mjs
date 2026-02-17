import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Product backfill: costPrice starts at 0, salePrice comes from old price.
  await prisma.$executeRawUnsafe(`
    UPDATE "Product"
    SET
      "costPrice" = COALESCE("costPrice", 0),
      "salePrice" = COALESCE("salePrice", "price")
  `);

  // SaleItem backfill from old price and current product cost (or 0 fallback).
  await prisma.$executeRawUnsafe(`
    UPDATE "SaleItem" si
    SET
      "unitPrice" = COALESCE(si."unitPrice", si."price"),
      "unitCost" = COALESCE(si."unitCost", p."costPrice", 0)
    FROM "Product" p
    WHERE si."productId" = p."id"
  `);

  // Safety fallback if any line was not matched in join.
  await prisma.$executeRawUnsafe(`
    UPDATE "SaleItem"
    SET
      "unitPrice" = COALESCE("unitPrice", "price"),
      "unitCost" = COALESCE("unitCost", 0)
  `);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Backfill concluido com sucesso.");
  })
  .catch(async (error) => {
    console.error("Falha no backfill:", error);
    await prisma.$disconnect();
    process.exit(1);
  });