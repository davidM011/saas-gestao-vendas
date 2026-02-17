"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Receivable = {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  saleId: string;
};

type Counters = {
  overdue: number;
  upcoming: number;
  paid: number;
};

type Filter = "all" | "overdue" | "upcoming" | "paid";

export default function ReceivablesPage() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [counters, setCounters] = useState<Counters>({ overdue: 0, upcoming: 0, paid: 0 });
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadReceivables(nextFilter: Filter = filter) {
    const response = await fetch(`/api/receivables?filter=${nextFilter}&daysAhead=7`, { cache: "no-store" });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(payload?.error ?? "Falha ao carregar contas a receber");
      return;
    }

    setReceivables(payload?.data ?? []);
    setCounters(payload?.counters ?? { overdue: 0, upcoming: 0, paid: 0 });
  }

  useEffect(() => {
    void loadReceivables("all");
  }, []);

  const now = useMemo(() => new Date(), [receivables]);

  async function applyFilter(nextFilter: Filter) {
    setFilter(nextFilter);
    setMessage(null);
    await loadReceivables(nextFilter);
  }

  async function markAsPaid(id: string) {
    setLoading(true);
    setMessage(null);

    const response = await fetch(`/api/receivables/${id}/pay`, {
      method: "PATCH",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(data?.error ?? "Falha ao marcar como pago");
      setLoading(false);
      return;
    }

    setMessage("Conta marcada como paga");
    await loadReceivables(filter);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">{counters.overdue}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">A vencer (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{counters.upcoming}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-700">{counters.paid}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contas a receber</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button variant={filter === "all" ? "default" : "secondary"} onClick={() => void applyFilter("all")}>Todas</Button>
            <Button variant={filter === "overdue" ? "default" : "secondary"} onClick={() => void applyFilter("overdue")}>Vencidas</Button>
            <Button variant={filter === "upcoming" ? "default" : "secondary"} onClick={() => void applyFilter("upcoming")}>A vencer</Button>
            <Button variant={filter === "paid" ? "default" : "secondary"} onClick={() => void applyFilter("paid")}>Pagas</Button>
          </div>

          {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Venda</TableHead>
                <TableHead>Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receivables.map((row) => {
                const dueDate = new Date(row.dueDate);
                const overdue = row.status === "PENDING" && dueDate < now;
                return (
                  <TableRow key={row.id}>
                    <TableCell>{dueDate.toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>R$ {row.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={overdue ? "border-red-300 text-red-700" : row.status === "PAID" ? "border-emerald-300 text-emerald-700" : ""}>
                        {overdue ? "VENCIDA" : row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.saleId}</TableCell>
                    <TableCell>
                      {row.status === "PENDING" ? (
                        <Button size="sm" type="button" disabled={loading} onClick={() => void markAsPaid(row.id)}>
                          Marcar pago
                        </Button>
                      ) : (
                        <span className="text-sm text-slate-500">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {receivables.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>Nenhuma conta encontrada para este filtro.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}