"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Product = {
  id: string;
  name: string;
  costPrice: number;
  salePrice: number;
  stock: number;
};

type Sale = {
  id: string;
  total: number;
  createdAt: string;
  items: Array<{ id: string; productId: string; quantity: number; unitPrice: number; unitCost: number }>;
  receivables: Array<{ id: string; amount: number; dueDate: string; status: string }>;
};

type SaleItemForm = {
  productId: string;
  quantity: string;
};

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [items, setItems] = useState<SaleItemForm[]>([{ productId: "", quantity: "1" }]);
  const [paymentType, setPaymentType] = useState<"CASH" | "CREDIT">("CASH");
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadProducts() {
    const response = await fetch("/api/inventory", { cache: "no-store" });
    const data = await response.json().catch(() => []);
    if (response.ok) {
      setProducts(data);
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          productId: item.productId || data[0]?.id || "",
        })),
      );
    }
  }

  async function loadSales() {
    const response = await fetch("/api/sales", { cache: "no-store" });
    const data = await response.json().catch(() => []);
    if (response.ok) setSales(data);
  }

  useEffect(() => {
    void Promise.all([loadProducts(), loadSales()]);
  }, []);

  const totalPreview = useMemo(() => {
    const priceMap = new Map(products.map((p) => [p.id, p.salePrice]));
    return items.reduce((acc, item) => {
      const price = priceMap.get(item.productId) ?? 0;
      const qty = Number(item.quantity) || 0;
      return acc + price * qty;
    }, 0);
  }, [items, products]);

  const grossProfitPreview = useMemo(() => {
    const productMap = new Map(products.map((p) => [p.id, p]));
    return items.reduce((acc, item) => {
      const product = productMap.get(item.productId);
      if (!product) return acc;
      const qty = Number(item.quantity) || 0;
      return acc + (product.salePrice - product.costPrice) * qty;
    }, 0);
  }, [items, products]);

  function addItem() {
    setItems((prev) => [...prev, { productId: products[0]?.id ?? "", quantity: "1" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (products.length === 0) {
      setMessage("Cadastre pelo menos um produto antes de criar uma venda");
      setLoading(false);
      return;
    }

    const payload = {
      paymentType,
      dueDate: paymentType === "CREDIT" ? new Date(`${dueDate}T00:00:00.000Z`).toISOString() : undefined,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
      })),
    };

    const response = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(data?.error ?? "Falha ao criar venda");
      setLoading(false);
      return;
    }

    setMessage("Venda criada com sucesso");
    setItems([{ productId: products[0]?.id ?? "", quantity: "1" }]);
    setPaymentType("CASH");
    setDueDate("");
    await Promise.all([loadProducts(), loadSales()]);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Nova venda</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 && (
            <p className="mb-3 text-sm text-slate-700">
              Nenhum produto cadastrado. Acesse Estoque para criar produtos primeiro.
            </p>
          )}
          <form className="space-y-3" onSubmit={handleSubmit}>
            {items.map((item, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-[1fr_120px_90px]">
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={item.productId}
                  onChange={(e) =>
                    setItems((prev) => prev.map((curr, i) => (i === index ? { ...curr, productId: e.target.value } : curr)))
                  }
                  required
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (estoque {product.stock})
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={(e) =>
                    setItems((prev) => prev.map((curr, i) => (i === index ? { ...curr, quantity: e.target.value } : curr)))
                  }
                  required
                />
                <Button type="button" variant="secondary" onClick={() => removeItem(index)} disabled={items.length === 1}>
                  Remover
                </Button>
              </div>
            ))}

            <Button type="button" variant="secondary" onClick={addItem} disabled={products.length === 0}>
              Adicionar item
            </Button>

            <div className="grid gap-2 md:grid-cols-2">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as "CASH" | "CREDIT")}
              >
                <option value="CASH">A vista</option>
                <option value="CREDIT">A prazo</option>
              </select>

              {paymentType === "CREDIT" && (
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              )}
            </div>

            <p className="text-sm text-slate-700">Total previsto: R$ {totalPreview.toFixed(2)}</p>
            <p className="text-sm text-slate-700">Lucro bruto previsto: R$ {grossProfitPreview.toFixed(2)}</p>
            {message && <p className="text-sm text-slate-700">{message}</p>}

            <Button type="submit" disabled={loading || products.length === 0}>
              {loading ? "Salvando..." : "Finalizar venda"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historico de vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Lucro bruto</TableHead>
                <TableHead>Pagamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.createdAt).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>R$ {sale.total.toFixed(2)}</TableCell>
                  <TableCell>{sale.items.length}</TableCell>
                  <TableCell>
                    R${" "}
                    {sale.items
                      .reduce((acc, item) => acc + (item.unitPrice - item.unitCost) * item.quantity, 0)
                      .toFixed(2)}
                  </TableCell>
                  <TableCell>{sale.receivables.length > 0 ? "Prazo" : "A vista"}</TableCell>
                </TableRow>
              ))}
              {sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>Nenhuma venda registrada.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
