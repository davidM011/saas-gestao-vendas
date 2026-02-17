import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createProductSchema } from "@/lib/validators/product";
import { createProductByTenant, listInventoryByTenant } from "@/server/services/inventory.service";

export async function GET() {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const data = await listInventoryByTenant(tenantId);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product = await createProductByTenant(tenantId, parsed.data);
  return NextResponse.json(product, { status: 201 });
}