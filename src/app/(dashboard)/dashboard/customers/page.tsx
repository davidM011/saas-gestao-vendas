"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
};

type CustomerForm = {
  name: string;
  phone: string;
  email: string;
};

const initialForm: CustomerForm = { name: "", phone: "", email: "" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<CustomerForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => (editingId ? "Editar cliente" : "Novo cliente"), [editingId]);

  async function loadCustomers() {
    const response = await fetch("/api/customers", { cache: "no-store" });
    const data = await response.json().catch(() => []);
    if (response.ok) setCustomers(data);
  }

  useEffect(() => {
    void loadCustomers();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email,
    };

    const endpoint = editingId ? `/api/customers/${editingId}` : "/api/customers";
    const method = editingId ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(data?.error ?? "Falha ao salvar cliente");
      setLoading(false);
      return;
    }

    setForm(initialForm);
    setEditingId(null);
    setMessage(editingId ? "Cliente atualizado" : "Cliente criado");
    await loadCustomers();
    setLoading(false);
  }

  function handleEdit(customer: Customer) {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      phone: customer.phone ?? "",
      email: customer.email ?? "",
    });
    setMessage(null);
  }

  async function handleDelete(id: string) {
    setMessage(null);
    const response = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(data?.error ?? "Falha ao excluir cliente");
      return;
    }

    setMessage("Cliente excluido");
    if (editingId === id) {
      setEditingId(null);
      setForm(initialForm);
    }
    await loadCustomers();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              placeholder="Nome"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <Input
              placeholder="Telefone"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <Input
              placeholder="E-mail"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            {message && <p className="text-sm text-slate-700">{message}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditingId(null);
                    setForm(initialForm);
                    setMessage(null);
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.phone ?? "-"}</TableCell>
                  <TableCell>{customer.email ?? "-"}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="secondary" type="button" onClick={() => handleEdit(customer)}>
                      Editar
                    </Button>
                    <Button size="sm" type="button" onClick={() => handleDelete(customer.id)}>
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>Nenhum cliente cadastrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}