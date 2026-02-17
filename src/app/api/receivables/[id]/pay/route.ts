import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { receivableIdSchema } from "@/lib/validators/receivable";
import { markReceivableAsPaidByTenant } from "@/server/services/receivables.service";

export async function PATCH(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const parsed = receivableIdSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await markReceivableAsPaidByTenant(tenantId, parsed.data.id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "RECEIVABLE_NOT_FOUND") {
      return NextResponse.json({ error: "Conta a receber nao encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: "Falha ao marcar como pago" }, { status: 500 });
  }
}