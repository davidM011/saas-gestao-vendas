import { db } from "@/lib/db";
import type { CreateSaleInput } from "@/lib/validators/sale";

function assertTenant(tenantId?: string) {
  if (!tenantId) {
    throw new Error("tenantId obrigatorio");
  }
  return tenantId;
}

export async function listSalesByTenant(tenantId?: string) {
  const safeTenantId = assertTenant(tenantId);
  return db.sale.findMany({
    where: { tenantId: safeTenantId },
    include: {
      items: true,
      receivables: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createSaleByTenant(tenantId: string | undefined, input: CreateSaleInput) {
  const safeTenantId = assertTenant(tenantId);

  const grouped = input.items.reduce<Record<string, number>>((acc, item) => {
    acc[item.productId] = (acc[item.productId] ?? 0) + item.quantity;
    return acc;
  }, {});

  const productIds = Object.keys(grouped);

  return db.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: {
        tenantId: safeTenantId,
        id: { in: productIds },
      },
    });

    if (products.length !== productIds.length) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const [productId, quantity] of Object.entries(grouped)) {
      const product = productMap.get(productId);
      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }
      if (product.stock < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }
    }

    const total = input.items.reduce((acc, item) => {
      const product = productMap.get(item.productId);
      if (!product) return acc;
      return acc + product.salePrice * item.quantity;
    }, 0);

    const sale = await tx.sale.create({
      data: {
        tenantId: safeTenantId,
        total,
      },
    });

    await tx.saleItem.createMany({
      data: input.items.map((item) => ({
        saleId: sale.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: productMap.get(item.productId)?.salePrice ?? 0,
        unitCost: productMap.get(item.productId)?.costPrice ?? 0,
        tenantId: safeTenantId,
      })),
    });

    for (const [productId, quantity] of Object.entries(grouped)) {
      const result = await tx.product.updateMany({
        where: {
          id: productId,
          tenantId: safeTenantId,
          stock: { gte: quantity },
        },
        data: {
          stock: { decrement: quantity },
        },
      });

      if (result.count === 0) {
        throw new Error("INSUFFICIENT_STOCK");
      }
    }

    await tx.stockMovement.createMany({
      data: Object.entries(grouped).map(([productId, quantity]) => ({
        tenantId: safeTenantId,
        productId,
        type: "OUT",
        quantity: -quantity,
        reason: `SALE:${sale.id}`,
      })),
    });

    if (input.paymentType === "CREDIT") {
      await tx.receivable.create({
        data: {
          saleId: sale.id,
          amount: total,
          dueDate: new Date(input.dueDate as string),
          status: "PENDING",
          tenantId: safeTenantId,
        },
      });
    }

    return tx.sale.findFirst({
      where: { id: sale.id, tenantId: safeTenantId },
      include: {
        items: true,
        receivables: true,
      },
    });
  });
}
