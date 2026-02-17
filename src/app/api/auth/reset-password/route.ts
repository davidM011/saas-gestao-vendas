import { NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { resetPasswordWithToken } from "@/server/services/auth.service";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await resetPasswordWithToken(parsed.data.token, parsed.data.tenantId, parsed.data.password);
    return NextResponse.json({ message: "Senha atualizada com sucesso" });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_OR_EXPIRED_TOKEN") {
      return NextResponse.json({ error: "Token invalido ou expirado" }, { status: 400 });
    }

    return NextResponse.json({ error: "Falha ao redefinir senha" }, { status: 500 });
  }
}