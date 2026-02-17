import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateCustomerSchema } from "@/lib/validators/customer";
import { deleteCustomerByTenant, updateCustomerByTenant } from "@/server/services/customers.service";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateCustomerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const customer = await updateCustomerByTenant(tenantId, params.id, parsed.data);
    return NextResponse.json(customer);
  } catch (error) {
    if (error instanceof Error && error.message === "CUSTOMER_NOT_FOUND") {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Falha ao atualizar cliente" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    await deleteCustomerByTenant(tenantId, params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "CUSTOMER_NOT_FOUND") {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Falha ao excluir cliente" }, { status: 500 });
  }
}