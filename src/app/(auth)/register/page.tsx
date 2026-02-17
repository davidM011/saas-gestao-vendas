"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (response.ok) {
      router.push("/login");
      return;
    }

    const data = await response.json().catch(() => null);
    setErrorMessage(data?.error ?? "Falha ao registrar");
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input placeholder="Nome" {...form.register("name")} />
            <Input placeholder="Empresa" {...form.register("tenantName")} />
            <Input placeholder="E-mail" type="email" {...form.register("email")} />
            <Input placeholder="Senha" type="password" {...form.register("password")} />
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            <Button className="w-full" type="submit">Registrar</Button>
            <Link className="block text-center text-sm text-slate-700 hover:underline" href="/login">
              Ja tem conta? Entrar
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}