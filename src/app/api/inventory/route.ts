import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createProductSchema, listProductsQuerySchema } from "@/lib/validators/product";
import { createProductByTenant, listAllProductsByTenant, listInventoryByTenant } from "@/server/services/inventory.service";

export async function GET(req: Request) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawQuery = {
    page: searchParams.get("page") ?? "1",
    pageSize: searchParams.get("pageSize") ?? "10",
    search: searchParams.get("search") ?? "",
  };

  const parsed = listProductsQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const all = searchParams.get("all") === "true";
  const data = all
    ? { items: await listAllProductsByTenant(tenantId), pagination: null }
    : await listInventoryByTenant(tenantId, parsed.data);
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
