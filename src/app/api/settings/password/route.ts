import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updatePasswordSchema } from "@/lib/validators/settings";
import { updateUserPassword } from "@/server/services/settings.service";

export async function PATCH(req: Request) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  const userId = session?.user?.id;

  if (!tenantId || !userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updatePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await updateUserPassword(tenantId, userId, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CURRENT_PASSWORD") {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
    }

    if (error instanceof Error && (error.message === "FORBIDDEN" || error.message === "USER_NOT_FOUND")) {
      return NextResponse.json({ error: "Acesso nao permitido" }, { status: 403 });
    }

    return NextResponse.json({ error: "Falha ao atualizar senha" }, { status: 500 });
  }
}