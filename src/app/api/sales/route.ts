import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSaleSchema } from "@/lib/validators/sale";
import { createSaleByTenant, listSalesByTenant } from "@/server/services/sales.service";

export async function GET() {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const data = await listSalesByTenant(tenantId);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSaleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const sale = await createSaleByTenant(tenantId, parsed.data);
    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "Produto nao encontrado" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json({ error: "Estoque insuficiente para concluir a venda" }, { status: 400 });
    }

    return NextResponse.json({ error: "Falha ao criar venda" }, { status: 500 });
  }
}