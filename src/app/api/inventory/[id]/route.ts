import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateProductSchema } from "@/lib/validators/product";
import { deleteProductByTenant, updateProductByTenant } from "@/server/services/inventory.service";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const product = await updateProductByTenant(tenantId, params.id, parsed.data);
    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "Produto nao encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Falha ao atualizar produto" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    await deleteProductByTenant(tenantId, params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "Produto nao encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Falha ao excluir produto" }, { status: 500 });
  }
}