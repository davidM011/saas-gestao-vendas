"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Product = {
  id: string;
  name: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  createdAt: string;
};

type InventoryResponse = {
  items: Product[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
};

type ProductForm = {
  name: string;
  costPrice: string;
  salePrice: string;
  stock: string;
  minStock: string;
};

type StockMovement = {
  id: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  reason: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
  };
};

type MovementForm = {
  productId: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: string;
  targetStock: string;
  reason: string;
};

const initialProductForm: ProductForm = { name: "", costPrice: "", salePrice: "", stock: "", minStock: "0" };
const initialMovementForm: MovementForm = { productId: "", type: "IN", quantity: "", targetStock: "", reason: "" };

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productOptions, setProductOptions] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);

  const [productForm, setProductForm] = useState<ProductForm>(initialProductForm);
  const [movementForm, setMovementForm] = useState<MovementForm>(initialMovementForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [loadingMovement, setLoadingMovement] = useState(false);

  const productTitle = useMemo(() => (editingId ? "Editar produto" : "Novo produto"), [editingId]);

  async function loadProducts(targetPage = page, targetSearch = search) {
    const params = new URLSearchParams({
      page: String(targetPage),
      pageSize: String(pageSize),
      search: targetSearch,
    });

    const response = await fetch(`/api/inventory?${params.toString()}`, { cache: "no-store" });
    const data = (await response.json().catch(() => null)) as InventoryResponse | null;
    if (response.ok && data) {
      setProducts(data.items);
      setPagination(data.pagination);
    }
  }

  async function loadProductOptions() {
    const response = await fetch("/api/inventory?all=true", { cache: "no-store" });
    const data = (await response.json().catch(() => null)) as InventoryResponse | null;
    if (response.ok && data) {
      setProductOptions(data.items);
      if (!movementForm.productId && data.items.length > 0) {
        setMovementForm((prev) => ({ ...prev, productId: data.items[0].id }));
      }
    }
  }

  async function loadLowStock() {
    const response = await fetch("/api/inventory/alerts/low-stock", { cache: "no-store" });
    const data = await response.json().catch(() => []);
    if (response.ok) setLowStockProducts(data);
  }

  async function loadMovements() {
    const response = await fetch("/api/inventory/movements", { cache: "no-store" });
    const data = await response.json().catch(() => []);
    if (response.ok) setMovements(data);
  }

  async function refreshInventory() {
    await Promise.all([loadProducts(page, search), loadProductOptions(), loadLowStock(), loadMovements()]);
  }

  useEffect(() => {
    void refreshInventory();
  }, [page]);

  async function applySearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPage(1);
    await loadProducts(1, search);
  }

  async function handleProductSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingProduct(true);
    setMessage(null);

    const payload = {
      name: productForm.name,
      costPrice: Number(productForm.costPrice),
      salePrice: Number(productForm.salePrice),
      stock: Number(productForm.stock),
      minStock: Number(productForm.minStock),
    };

    const endpoint = editingId ? `/api/inventory/${editingId}` : "/api/inventory";
    const method = editingId ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(data?.error ?? "Falha ao salvar produto");
      setLoadingProduct(false);
      return;
    }

    setProductForm(initialProductForm);
    setEditingId(null);
    setMessage(editingId ? "Produto atualizado" : "Produto criado");
    await refreshInventory();
    setLoadingProduct(false);
  }

  function handleProductEdit(product: Product) {
    setEditingId(product.id);
    setProductForm({
      name: product.name,
      costPrice: String(product.costPrice),
      salePrice: String(product.salePrice),
      stock: String(product.stock),
      minStock: String(product.minStock),
    });
    setMessage(null);
  }

  async function handleProductDelete(id: string) {
    setMessage(null);
    const response = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(data?.error ?? "Falha ao excluir produto");
      return;
    }

    setMessage("Produto excluido");
    if (editingId === id) {
      setEditingId(null);
      setProductForm(initialProductForm);
    }
    await refreshInventory();
  }

  async function handleMovementSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingMovement(true);
    setMessage(null);

    const payload = {
      productId: movementForm.productId,
      type: movementForm.type,
      quantity: movementForm.type === "ADJUST" ? undefined : Number(movementForm.quantity),
      targetStock: movementForm.type === "ADJUST" ? Number(movementForm.targetStock) : undefined,
      reason: movementForm.reason || undefined,
    };

    const response = await fetch("/api/inventory/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(data?.error ?? "Falha ao registrar movimentacao");
      setLoadingMovement(false);
      return;
    }

    setMovementForm((prev) => ({
      ...prev,
      quantity: "",
      targetStock: "",
      reason: "",
    }));

    setMessage("Movimentacao registrada");
    await refreshInventory();
    setLoadingMovement(false);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Alertas de estoque baixo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.length === 0 && <p className="text-sm text-slate-600">Sem alertas no momento.</p>}
            {lowStockProducts.map((product) => (
              <Badge key={product.id}>{product.name} ({product.stock}/{product.minStock})</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{productTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProductSubmit} className="space-y-3">
              <Input
                placeholder="Nome"
                value={productForm.name}
                onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            <Input
              placeholder="Preco de custo"
              type="number"
              min="0"
              step="0.01"
              value={productForm.costPrice}
              onChange={(e) => setProductForm((prev) => ({ ...prev, costPrice: e.target.value }))}
              required
            />
            <Input
              placeholder="Preco de venda"
              type="number"
              min="0"
              step="0.01"
              value={productForm.salePrice}
              onChange={(e) => setProductForm((prev) => ({ ...prev, salePrice: e.target.value }))}
              required
            />
              <Input
                placeholder="Estoque"
                type="number"
                min="0"
                step="1"
              value={productForm.stock}
              onChange={(e) => setProductForm((prev) => ({ ...prev, stock: e.target.value }))}
              required
            />
            <Input
              placeholder="Estoque minimo"
              type="number"
              min="0"
              step="1"
              value={productForm.minStock}
              onChange={(e) => setProductForm((prev) => ({ ...prev, minStock: e.target.value }))}
              required
            />
              <div className="flex gap-2">
                <Button type="submit" disabled={loadingProduct}>
                  {loadingProduct ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setEditingId(null);
                      setProductForm(initialProductForm);
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
            <CardTitle>Movimentacao</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMovementSubmit} className="space-y-3">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={movementForm.productId}
                onChange={(e) => setMovementForm((prev) => ({ ...prev, productId: e.target.value }))}
                required
              >
                {productOptions.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>

              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={movementForm.type}
                onChange={(e) => setMovementForm((prev) => ({ ...prev, type: e.target.value as MovementForm["type"] }))}
              >
                <option value="IN">Entrada</option>
                <option value="OUT">Saida</option>
                <option value="ADJUST">Ajuste manual</option>
              </select>

              {movementForm.type !== "ADJUST" && (
                <Input
                  placeholder="Quantidade"
                  type="number"
                  min="1"
                  step="1"
                  value={movementForm.quantity}
                  onChange={(e) => setMovementForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  required
                />
              )}

              {movementForm.type === "ADJUST" && (
                <Input
                  placeholder="Estoque final"
                  type="number"
                  min="0"
                  step="1"
                  value={movementForm.targetStock}
                  onChange={(e) => setMovementForm((prev) => ({ ...prev, targetStock: e.target.value }))}
                  required
                />
              )}

              <Input
                placeholder="Motivo (opcional)"
                value={movementForm.reason}
                onChange={(e) => setMovementForm((prev) => ({ ...prev, reason: e.target.value }))}
              />

              <Button type="submit" disabled={loadingMovement}>
                {loadingMovement ? "Registrando..." : "Registrar movimentacao"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="mb-3 flex gap-2" onSubmit={applySearch}>
              <Input
                placeholder="Buscar por nome"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button type="submit" variant="secondary">Buscar</Button>
            </form>

            <Table>
              <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Venda</TableHead>
                <TableHead>Margem</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Minimo</TableHead>
                <TableHead>Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>R$ {product.costPrice.toFixed(2)}</TableCell>
                  <TableCell>R$ {product.salePrice.toFixed(2)}</TableCell>
                  <TableCell>R$ {(product.salePrice - product.costPrice).toFixed(2)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>{product.minStock}</TableCell>
                  <TableCell className="flex gap-2">
                      <Button size="sm" variant="secondary" type="button" onClick={() => handleProductEdit(product)}>
                        Editar
                      </Button>
                      <Button size="sm" type="button" onClick={() => handleProductDelete(product.id)}>
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>Nenhum produto cadastrado.</TableCell>
                </TableRow>
              )}
              </TableBody>
            </Table>

            {pagination && (
              <div className="mt-3 flex items-center justify-between text-sm">
                <span>
                  Pagina {pagination.page} de {pagination.totalPages} ({pagination.total} itens)
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                  >
                    Proxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historico de movimentacoes</CardTitle>
        </CardHeader>
        <CardContent>
          {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>{new Date(movement.createdAt).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>{movement.product.name}</TableCell>
                  <TableCell>{movement.type}</TableCell>
                  <TableCell>{movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}</TableCell>
                  <TableCell>{movement.reason ?? "-"}</TableCell>
                </TableRow>
              ))}
              {movements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>Sem movimentacoes registradas.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
