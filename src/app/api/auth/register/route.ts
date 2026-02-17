import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validators/auth";
import { registerUser } from "@/server/services/auth.service";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const created = await registerUser(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      return NextResponse.json({ error: "E-mail ja cadastrado" }, { status: 409 });
    }

    return NextResponse.json({ error: "Falha ao registrar" }, { status: 500 });
  }
}