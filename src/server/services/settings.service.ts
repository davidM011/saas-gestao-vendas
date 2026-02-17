import { compare, hash } from "bcryptjs";
import { db } from "@/lib/db";
import type { UpdatePasswordInput, UpdateTenantInput } from "@/lib/validators/settings";

function assertTenant(tenantId?: string) {
  if (!tenantId) {
    throw new Error("tenantId obrigatorio");
  }
  return tenantId;
}

function assertUser(userId?: string) {
  if (!userId) {
    throw new Error("userId obrigatorio");
  }
  return userId;
}

export async function getTenantSettings(tenantId: string | undefined, userId: string | undefined) {
  const safeTenantId = assertTenant(tenantId);
  const safeUserId = assertUser(userId);

  const membership = await db.membership.findFirst({
    where: {
      tenantId: safeTenantId,
      userId: safeUserId,
    },
    include: {
      tenant: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!membership) {
    throw new Error("MEMBERSHIP_NOT_FOUND");
  }

  return {
    tenant: {
      id: membership.tenant.id,
      name: membership.tenant.name,
    },
    user: {
      name: membership.user.name,
      email: membership.user.email,
    },
  };
}

export async function updateTenantName(tenantId: string | undefined, userId: string | undefined, input: UpdateTenantInput) {
  const safeTenantId = assertTenant(tenantId);
  const safeUserId = assertUser(userId);

  const membership = await db.membership.findFirst({
    where: {
      tenantId: safeTenantId,
      userId: safeUserId,
      role: {
        in: ["OWNER", "ADMIN"],
      },
    },
  });

  if (!membership) {
    throw new Error("FORBIDDEN");
  }

  return db.tenant.update({
    where: { id: safeTenantId },
    data: { name: input.name },
  });
}

export async function updateUserPassword(tenantId: string | undefined, userId: string | undefined, input: UpdatePasswordInput) {
  const safeTenantId = assertTenant(tenantId);
  const safeUserId = assertUser(userId);

  const membership = await db.membership.findFirst({
    where: {
      tenantId: safeTenantId,
      userId: safeUserId,
    },
  });

  if (!membership) {
    throw new Error("FORBIDDEN");
  }

  const user = await db.user.findUnique({
    where: { id: safeUserId },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const valid = await compare(input.currentPassword, user.password);
  if (!valid) {
    throw new Error("INVALID_CURRENT_PASSWORD");
  }

  const newPasswordHash = await hash(input.newPassword, 12);

  await db.user.update({
    where: { id: safeUserId },
    data: { password: newPasswordHash },
  });

  return { ok: true };
}