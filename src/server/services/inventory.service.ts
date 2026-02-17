import { db } from "@/lib/db";
import type { CreateProductInput, CreateStockMovementInput, ListProductsQueryInput, UpdateProductInput } from "@/lib/validators/product";

function assertTenant(tenantId?: string) {
  if (!tenantId) {
    throw new Error("tenantId obrigatorio");
  }
  return tenantId;
}

export async function listInventoryByTenant(tenantId: string | undefined, query: ListProductsQueryInput) {
  const safeTenantId = assertTenant(tenantId);
  const search = query.search.trim();
  const where = {
    tenantId: safeTenantId,
    ...(search.length > 0 ? { name: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    db.product.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export async function listAllProductsByTenant(tenantId?: string) {
  const safeTenantId = assertTenant(tenantId);
  return db.product.findMany({
    where: { tenantId: safeTenantId },
    orderBy: { name: "asc" },
  });
}

export async function createProductByTenant(tenantId: string | undefined, input: CreateProductInput) {
  const safeTenantId = assertTenant(tenantId);

  return db.product.create({
    data: {
      tenantId: safeTenantId,
      name: input.name,
      costPrice: input.costPrice,
      salePrice: input.salePrice,
      stock: input.stock,
      minStock: input.minStock,
    },
  });
}

export async function updateProductByTenant(tenantId: string | undefined, id: string, input: UpdateProductInput) {
  const safeTenantId = assertTenant(tenantId);

  const result = await db.product.updateMany({
    where: { id, tenantId: safeTenantId },
    data: {
      name: input.name,
      costPrice: input.costPrice,
      salePrice: input.salePrice,
      stock: input.stock,
      minStock: input.minStock,
    },
  });

  if (result.count === 0) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  return db.product.findFirst({ where: { id, tenantId: safeTenantId } });
}

export async function deleteProductByTenant(tenantId: string | undefined, id: string) {
  const safeTenantId = assertTenant(tenantId);

  const result = await db.product.deleteMany({
    where: { id, tenantId: safeTenantId },
  });

  if (result.count === 0) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  return { ok: true };
}

export async function listStockMovementsByTenant(tenantId: string | undefined) {
  const safeTenantId = assertTenant(tenantId);

  return db.stockMovement.findMany({
    where: { tenantId: safeTenantId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function listLowStockProductsByTenant(tenantId: string | undefined) {
  const safeTenantId = assertTenant(tenantId);

  const products = await db.product.findMany({
    where: {
      tenantId: safeTenantId,
    },
    orderBy: [{ stock: "asc" }, { minStock: "asc" }],
  });

  return products.filter((product) => product.stock < product.minStock);
}

export async function createStockMovementByTenant(tenantId: string | undefined, input: CreateStockMovementInput) {
  const safeTenantId = assertTenant(tenantId);

  return db.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: {
        id: input.productId,
        tenantId: safeTenantId,
      },
    });

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    let newStock = product.stock;
    let movementQuantity = 0;

    if (input.type === "IN") {
      const qty = input.quantity ?? 0;
      newStock = product.stock + qty;
      movementQuantity = qty;
    }

    if (input.type === "OUT") {
      const qty = input.quantity ?? 0;
      if (product.stock < qty) {
        throw new Error("INSUFFICIENT_STOCK");
      }
      newStock = product.stock - qty;
      movementQuantity = -qty;
    }

    if (input.type === "ADJUST") {
      const target = input.targetStock ?? product.stock;
      newStock = target;
      movementQuantity = target - product.stock;
    }

    await tx.product.update({
      where: { id: product.id },
      data: { stock: newStock },
    });

    return tx.stockMovement.create({
      data: {
        tenantId: safeTenantId,
        productId: product.id,
        type: input.type,
        quantity: movementQuantity,
        reason: input.reason,
      },
      include: { product: true },
    });
  });
}
