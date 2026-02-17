import { db } from "@/lib/db";

function assertTenant(tenantId?: string) {
  if (!tenantId) {
    throw new Error("tenantId obrigatorio");
  }
  return tenantId;
}

type ReceivableFilter = "all" | "overdue" | "upcoming" | "paid";

export async function listReceivablesByTenant(tenantId: string | undefined, filter: ReceivableFilter = "all", daysAhead = 7) {
  const safeTenantId = assertTenant(tenantId);
  const now = new Date();
  const upcomingLimit = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const whereBase = { tenantId: safeTenantId };

  if (filter === "overdue") {
    return db.receivable.findMany({
      where: {
        ...whereBase,
        status: "PENDING",
        dueDate: { lt: now },
      },
      include: { sale: true },
      orderBy: { dueDate: "asc" },
    });
  }

  if (filter === "upcoming") {
    return db.receivable.findMany({
      where: {
        ...whereBase,
        status: "PENDING",
        dueDate: { gte: now, lte: upcomingLimit },
      },
      include: { sale: true },
      orderBy: { dueDate: "asc" },
    });
  }

  if (filter === "paid") {
    return db.receivable.findMany({
      where: {
        ...whereBase,
        status: "PAID",
      },
      include: { sale: true },
      orderBy: { dueDate: "desc" },
    });
  }

  return db.receivable.findMany({
    where: whereBase,
    include: { sale: true },
    orderBy: { dueDate: "asc" },
  });
}

export async function markReceivableAsPaidByTenant(tenantId: string | undefined, id: string) {
  const safeTenantId = assertTenant(tenantId);

  const existing = await db.receivable.findFirst({
    where: {
      id,
      tenantId: safeTenantId,
    },
  });

  if (!existing) {
    throw new Error("RECEIVABLE_NOT_FOUND");
  }

  if (existing.status === "PAID") {
    return existing;
  }

  return db.receivable.update({
    where: { id: existing.id },
    data: { status: "PAID" },
  });
}

export async function getReceivablesCountersByTenant(tenantId: string | undefined, daysAhead = 7) {
  const safeTenantId = assertTenant(tenantId);
  const now = new Date();
  const upcomingLimit = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const [overdue, upcoming, paid] = await Promise.all([
    db.receivable.count({
      where: {
        tenantId: safeTenantId,
        status: "PENDING",
        dueDate: { lt: now },
      },
    }),
    db.receivable.count({
      where: {
        tenantId: safeTenantId,
        status: "PENDING",
        dueDate: { gte: now, lte: upcomingLimit },
      },
    }),
    db.receivable.count({
      where: {
        tenantId: safeTenantId,
        status: "PAID",
      },
    }),
  ]);

  return { overdue, upcoming, paid };
}