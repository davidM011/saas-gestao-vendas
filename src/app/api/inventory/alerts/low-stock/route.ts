import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listLowStockProductsByTenant } from "@/server/services/inventory.service";

export async function GET() {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const data = await listLowStockProductsByTenant(tenantId);
  return NextResponse.json(data);
}
