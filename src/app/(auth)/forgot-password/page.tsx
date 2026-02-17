"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ForgotPasswordInput = {
  email: string;
};

export default function ForgotPasswordPage() {
  const form = useForm<ForgotPasswordInput>();
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const onSubmit = form.handleSubmit(async (values) => {
    setMessage(null);
    setResetUrl(null);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await response.json().catch(() => null);
    setMessage(data?.message ?? "Se o e-mail existir, um link foi gerado.");
    if (data?.resetUrl) {
      setResetUrl(data.resetUrl);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recuperar senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input placeholder="Seu e-mail" type="email" {...form.register("email", { required: true })} />
            <Button className="w-full" type="submit">Gerar link de recuperacao</Button>
            {message && <p className="text-sm text-slate-700">{message}</p>}
            {resetUrl && (
              <a className="block text-sm text-blue-700 hover:underline" href={resetUrl}>
                Abrir link de redefinicao
              </a>
            )}
            <Link className="block text-center text-sm text-slate-700 hover:underline" href="/login">
              Voltar para login
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}