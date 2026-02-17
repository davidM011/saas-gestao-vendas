import { randomBytes, createHash } from "crypto";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import type { RegisterInput } from "@/lib/validators/auth";

type PublicRegisterResult = {
  id: string;
  email: string;
  tenantId: string;
};

export async function registerUser(input: RegisterInput): Promise<PublicRegisterResult> {
  const existingUser = await db.user.findUnique({ where: { email: input.email } });

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await hash(input.password, 12);

  const created = await db.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({ data: { name: input.tenantName } });
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: passwordHash,
      },
    });

    await tx.membership.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: "OWNER",
      },
    });

    return { user, tenant };
  });

  return {
    id: created.user.id,
    email: created.user.email,
    tenantId: created.tenant.id,
  };
}

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(email: string) {
  const user = await db.user.findUnique({
    where: { email },
    include: { memberships: { take: 1 } },
  });

  // Retorno neutro para nao revelar se o e-mail existe.
  if (!user || user.memberships.length === 0) {
    return { ok: true };
  }

  const tenantId = user.memberships[0].tenantId;
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tenantId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    ok: true,
    token: rawToken,
    tenantId,
    expiresAt,
  };
}

export async function resetPasswordWithToken(token: string, tenantId: string, newPassword: string) {
  const tokenHash = hashResetToken(token);

  const record = await db.passwordResetToken.findFirst({
    where: {
      tokenHash,
      tenantId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: true,
    },
  });

  if (!record) {
    throw new Error("INVALID_OR_EXPIRED_TOKEN");
  }

  const newPasswordHash = await hash(newPassword, 12);

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { password: newPasswordHash },
    }),
    db.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true };
}