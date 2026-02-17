import { db } from "@/lib/db";

function assertTenant(tenantId?: string) {
  if (!tenantId) {
    throw new Error("tenantId obrigatorio");
  }
  return tenantId;
}

function monthRange(baseDate = new Date()) {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1, 0, 0, 0, 0);
  return { start, end };
}

function dayRange(baseDate = new Date()) {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1, 0, 0, 0, 0);
  return { start, end };
}

export async function getDashboardSummary(tenantId?: string) {
  const safeTenantId = assertTenant(tenantId);
  const now = new Date();
  const { start: monthStart, end: monthEnd } = monthRange(now);
  const { start: dayStart, end: dayEnd } = dayRange(now);

  const [monthlySales, salesToday, allProducts, overdueReceivables] = await Promise.all([
    db.sale.findMany({
      where: {
        tenantId: safeTenantId,
        createdAt: { gte: monthStart, lt: monthEnd },
      },
      select: { total: true },
    }),
    db.sale.count({
      where: {
        tenantId: safeTenantId,
        createdAt: { gte: dayStart, lt: dayEnd },
      },
    }),
    db.product.findMany({
      where: { tenantId: safeTenantId },
      select: { stock: true, minStock: true },
    }),
    db.receivable.count({
      where: {
        tenantId: safeTenantId,
        status: "PENDING",
        dueDate: { lt: now },
      },
    }),
  ]);

  const monthlyRevenue = monthlySales.reduce((acc, row) => acc + row.total, 0);
  const ticketAverage = monthlySales.length > 0 ? monthlyRevenue / monthlySales.length : 0;
  const lowStockCount = allProducts.filter((product) => product.stock < product.minStock).length;

  return {
    monthlyRevenue,
    salesToday,
    ticketAverage,
    lowStockCount,
    overdueReceivables,
  };
}

export async function getSalesByDayChart(tenantId?: string) {
  const safeTenantId = assertTenant(tenantId);
  const now = new Date();
  const { start: monthStart, end: monthEnd } = monthRange(now);

  const sales = await db.sale.findMany({
    where: {
      tenantId: safeTenantId,
      createdAt: { gte: monthStart, lt: monthEnd },
    },
    select: {
      total: true,
      createdAt: true,
    },
  });

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const totals = new Map<number, number>();

  for (let day = 1; day <= daysInMonth; day += 1) {
    totals.set(day, 0);
  }

  for (const sale of sales) {
    const day = new Date(sale.createdAt).getDate();
    totals.set(day, (totals.get(day) ?? 0) + sale.total);
  }

  return Array.from(totals.entries()).map(([day, total]) => ({
    day: String(day).padStart(2, "0"),
    total,
  }));
}

export async function getTopProductsChart(tenantId?: string) {
  const safeTenantId = assertTenant(tenantId);

  const saleItems = await db.saleItem.findMany({
    where: {
      sale: {
        tenantId: safeTenantId,
      },
    },
    select: {
      productId: true,
      quantity: true,
    },
  });

  const quantityByProduct = new Map<string, number>();

  for (const item of saleItems) {
    quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) ?? 0) + item.quantity);
  }

  const top = Array.from(quantityByProduct.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const products = await db.product.findMany({
    where: {
      tenantId: safeTenantId,
      id: { in: top.map(([productId]) => productId) },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const productNameById = new Map(products.map((p) => [p.id, p.name]));

  return top.map(([productId, quantity]) => ({
    name: productNameById.get(productId) ?? "Produto",
    quantity,
  }));
}

export async function getDashboardData(tenantId?: string) {
  const safeTenantId = assertTenant(tenantId);
  const now = new Date();

  const [summary, salesByDay, topProducts, lowStockAlerts, overdueReceivableAlerts] = await Promise.all([
    getDashboardSummary(safeTenantId),
    getSalesByDayChart(safeTenantId),
    getTopProductsChart(safeTenantId),
    db.product.findMany({
      where: {
        tenantId: safeTenantId,
      },
      orderBy: { stock: "asc" },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true,
      },
    }),
    db.receivable.findMany({
      where: {
        tenantId: safeTenantId,
        status: "PENDING",
        dueDate: { lt: now },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: {
        id: true,
        dueDate: true,
        amount: true,
      },
    }),
  ]);

  return {
    summary,
    charts: {
      salesByDay,
      topProducts,
    },
    alerts: {
      lowStock: lowStockAlerts
        .filter((product) => product.stock < product.minStock)
        .slice(0, 5),
      overdueReceivables: overdueReceivableAlerts,
    },
  };
}
