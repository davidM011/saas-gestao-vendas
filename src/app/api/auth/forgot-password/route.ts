import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { env } from "@/lib/env";
import { createPasswordResetToken } from "@/server/services/auth.service";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await createPasswordResetToken(parsed.data.email);

  // MVP: sem provedor de e-mail, retornamos o link de recuperacao para uso local.
  if ("token" in result && result.token && result.tenantId) {
    const resetUrl = `${env.AUTH_URL}/reset-password?token=${result.token}&tenantId=${result.tenantId}`;

    return NextResponse.json({
      message: "Se o e-mail existir, um link de recuperacao foi gerado.",
      resetUrl,
    });
  }

  return NextResponse.json({
    message: "Se o e-mail existir, um link de recuperacao foi gerado.",
  });
}
