"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesByDayChart, TopProductsChart } from "@/components/charts/dashboard-charts";

type DashboardData = {
  summary: {
    monthlyRevenue: number;
    salesToday: number;
    ticketAverage: number;
    lowStockCount: number;
    overdueReceivables: number;
  };
  charts: {
    salesByDay: Array<{ day: string; total: number }>;
    topProducts: Array<{ name: string; quantity: number }>;
  };
  alerts: {
    lowStock: Array<{ id: string; name: string; stock: number }>;
    overdueReceivables: Array<{ id: string; dueDate: string; amount: number }>;
  };
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/dashboard/summary", { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (response.ok) setData(payload);
    }

    void load();
  }, []);

  const summary = data?.summary;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Faturamento do mes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ {(summary?.monthlyRevenue ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vendas do dia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary?.salesToday ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ticket medio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ {(summary?.ticketAverage ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estoque baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary?.lowStockCount ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contas vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary?.overdueReceivables ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vendas por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesByDayChart data={data?.charts.salesByDay ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <TopProductsChart data={data?.charts.topProducts ?? []} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alertas de estoque baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {(data?.alerts.lowStock ?? []).map((item) => (
                <li key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span>{item.name}</span>
                  <span className="font-semibold">{item.stock}</span>
                </li>
              ))}
              {(data?.alerts.lowStock ?? []).length === 0 && <li className="text-muted-foreground">Sem alertas de estoque.</li>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alertas de vencimento</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {(data?.alerts.overdueReceivables ?? []).map((item) => (
                <li key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span>{new Date(item.dueDate).toLocaleDateString("pt-BR")}</span>
                  <span className="font-semibold">R$ {item.amount.toFixed(2)}</span>
                </li>
              ))}
              {(data?.alerts.overdueReceivables ?? []).length === 0 && (
                <li className="text-muted-foreground">Sem contas vencidas.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
