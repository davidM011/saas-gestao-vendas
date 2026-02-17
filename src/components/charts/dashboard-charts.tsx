"use client";

import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";

type SalesByDayPoint = {
  day: string;
  total: number;
};

type TopProductPoint = {
  name: string;
  quantity: number;
};

export function SalesByDayChart({ data }: { data: SalesByDayPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip formatter={(value) => [`R$ ${Number(value ?? 0).toFixed(2)}`, "Vendas"]} />
          <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopProductsChart({ data }: { data: TopProductPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => [Number(value ?? 0), "Quantidade"]} />
          <Bar dataKey="quantity" fill="#16a34a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}