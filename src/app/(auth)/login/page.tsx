"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type LoginInput = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const form = useForm<LoginInput>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setErrorMessage("E-mail ou senha invalidos");
      return;
    }

    router.push("/dashboard");
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input placeholder="E-mail" type="email" {...form.register("email", { required: true })} />
            <Input placeholder="Senha" type="password" {...form.register("password", { required: true })} />
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            <Button className="w-full" type="submit">Login</Button>
            <Link className="block text-center text-sm text-blue-700 hover:underline" href="/forgot-password">
              Esqueci minha senha
            </Link>
            <Link className="block text-center text-sm text-slate-700 hover:underline" href="/register">
              Nao tem conta? Criar agora
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}