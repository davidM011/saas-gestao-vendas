"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ResetPasswordInput = {
  password: string;
  confirmPassword: string;
};

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const form = useForm<ResetPasswordInput>();
  const [message, setMessage] = useState<string | null>(null);

  const token = params.get("token") ?? "";
  const tenantId = params.get("tenantId") ?? "";

  const onSubmit = form.handleSubmit(async (values) => {
    setMessage(null);

    if (values.password !== values.confirmPassword) {
      setMessage("As senhas nao conferem");
      return;
    }

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        tenantId,
        password: values.password,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(data?.error ?? "Falha ao redefinir senha");
      return;
    }

    setMessage("Senha redefinida com sucesso. Redirecionando para login...");
    setTimeout(() => router.push("/login"), 1000);
  });

  if (!token || !tenantId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link invalido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">O link de redefinicao esta incompleto.</p>
            <Link className="mt-4 block text-sm text-blue-700 hover:underline" href="/forgot-password">
              Gerar novo link
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Redefinir senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input placeholder="Nova senha" type="password" {...form.register("password", { required: true, minLength: 6 })} />
            <Input placeholder="Confirmar senha" type="password" {...form.register("confirmPassword", { required: true, minLength: 6 })} />
            {message && <p className="text-sm text-slate-700">{message}</p>}
            <Button className="w-full" type="submit">Salvar nova senha</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Carregando...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}