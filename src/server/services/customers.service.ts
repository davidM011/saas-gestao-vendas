import { db } from "@/lib/db";
import type { CreateCustomerInput, UpdateCustomerInput } from "@/lib/validators/customer";

function assertTenant(tenantId?: string) {
  if (!tenantId) {
    throw new Error("tenantId obrigatorio");
  }
  return tenantId;
}

function normalizeOptional(value?: string) {
  if (!value || value.trim().length === 0) {
    return null;
  }
  return value.trim();
}

export async function listCustomersByTenant(tenantId?: string) {
  const safeTenantId = assertTenant(tenantId);
  return db.customer.findMany({
    where: { tenantId: safeTenantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCustomerByTenant(tenantId: string | undefined, input: CreateCustomerInput) {
  const safeTenantId = assertTenant(tenantId);

  return db.customer.create({
    data: {
      tenantId: safeTenantId,
      name: input.name,
      phone: normalizeOptional(input.phone),
      email: normalizeOptional(input.email),
    },
  });
}

export async function updateCustomerByTenant(tenantId: string | undefined, id: string, input: UpdateCustomerInput) {
  const safeTenantId = assertTenant(tenantId);

  const result = await db.customer.updateMany({
    where: { id, tenantId: safeTenantId },
    data: {
      name: input.name,
      phone: normalizeOptional(input.phone),
      email: normalizeOptional(input.email),
    },
  });

  if (result.count === 0) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }

  return db.customer.findFirst({ where: { id, tenantId: safeTenantId } });
}

export async function deleteCustomerByTenant(tenantId: string | undefined, id: string) {
  const safeTenantId = assertTenant(tenantId);

  const result = await db.customer.deleteMany({
    where: { id, tenantId: safeTenantId },
  });

  if (result.count === 0) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }

  return { ok: true };
}