import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { receivableFilterSchema } from "@/lib/validators/receivable";
import { getReceivablesCountersByTenant, listReceivablesByTenant } from "@/server/services/receivables.service";

export async function GET(req: Request) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = receivableFilterSchema.safeParse({
    filter: searchParams.get("filter") ?? "all",
    daysAhead: searchParams.get("daysAhead") ?? 7,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [data, counters] = await Promise.all([
    listReceivablesByTenant(tenantId, parsed.data.filter, parsed.data.daysAhead),
    getReceivablesCountersByTenant(tenantId, parsed.data.daysAhead),
  ]);

  return NextResponse.json({ data, counters });
}