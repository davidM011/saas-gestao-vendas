import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCustomerSchema } from "@/lib/validators/customer";
import { createCustomerByTenant, listCustomersByTenant } from "@/server/services/customers.service";

export async function GET() {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const data = await listCustomersByTenant(tenantId);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createCustomerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const customer = await createCustomerByTenant(tenantId, parsed.data);
  return NextResponse.json(customer, { status: 201 });
}