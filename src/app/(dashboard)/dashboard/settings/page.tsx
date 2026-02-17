"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type TenantResponse = {
  tenant: {
    id: string;
    name: string;
  };
  user: {
    name: string | null;
    email: string;
  };
};

export default function SettingsPage() {
  const [tenantName, setTenantName] = useState("");
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loadingTenant, setLoadingTenant] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/settings/tenant", { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as TenantResponse | null;

      if (!response.ok || !data) {
        setMessage("Falha ao carregar configuracoes");
        return;
      }

      setTenantName(data.tenant.name);
      setEmail(data.user.email);
      setUserName(data.user.name ?? "");
    }

    void load();
  }, []);

  async function handleTenantSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingTenant(true);
    setMessage(null);

    const response = await fetch("/api/settings/tenant", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: tenantName }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(data?.error ?? "Falha ao salvar empresa");
      setLoadingTenant(false);
      return;
    }

    setMessage("Empresa atualizada com sucesso");
    setLoadingTenant(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingPassword(true);
    setMessage(null);

    const response = await fetch("/api/settings/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(data?.error ?? "Falha ao atualizar senha");
      setLoadingPassword(false);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setMessage("Senha atualizada com sucesso");
    setLoadingPassword(false);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleTenantSubmit}>
            <Input placeholder="Nome da empresa" value={tenantName} onChange={(e) => setTenantName(e.target.value)} required />
            <Button type="submit" disabled={loadingTenant}>
              {loadingTenant ? "Salvando..." : "Salvar empresa"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Input value={userName} readOnly />
            <Input value={email} readOnly />
          </div>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Seguranca</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={handlePasswordSubmit}>
            <Input
              type="password"
              placeholder="Senha atual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Nova senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Button type="submit" disabled={loadingPassword}>
              {loadingPassword ? "Atualizando..." : "Atualizar senha"}
            </Button>
          </form>

          {message && <p className="mt-3 text-sm text-slate-700">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}