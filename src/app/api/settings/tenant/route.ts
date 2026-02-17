import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateTenantSchema } from "@/lib/validators/settings";
import { getTenantSettings, updateTenantName } from "@/server/services/settings.service";

export async function GET() {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  const userId = session?.user?.id;

  if (!tenantId || !userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const data = await getTenantSettings(tenantId, userId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === "MEMBERSHIP_NOT_FOUND") {
      return NextResponse.json({ error: "Acesso nao permitido" }, { status: 403 });
    }
    return NextResponse.json({ error: "Falha ao carregar configuracoes" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  const userId = session?.user?.id;

  if (!tenantId || !userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateTenantSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const tenant = await updateTenantName(tenantId, userId, parsed.data);
    return NextResponse.json({ id: tenant.id, name: tenant.name });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Somente admin/owner pode alterar a empresa" }, { status: 403 });
    }
    return NextResponse.json({ error: "Falha ao atualizar empresa" }, { status: 500 });
  }
}