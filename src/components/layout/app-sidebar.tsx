"use client";

import Link from "next/link";
import { Menu, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/sales", label: "Vendas" },
  { href: "/dashboard/inventory", label: "Estoque" },
  { href: "/dashboard/customers", label: "Clientes" },
  { href: "/dashboard/receivables", label: "Recebiveis" },
  { href: "/dashboard/settings", label: "Configuracoes" },
];

export function AppSidebar() {
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r bg-background p-4 lg:block">
        <div className="mb-8 flex items-center gap-2 text-lg font-semibold">
          <Store className="h-5 w-5" /> Loja SaaS
        </div>
        <nav className="space-y-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Sheet
          trigger={
            <Button variant="secondary" size="sm">
              <Menu className="h-4 w-4" />
            </Button>
          }
        >
          <div className="mb-8 flex items-center gap-2 text-lg font-semibold">
            <Store className="h-5 w-5" /> Loja SaaS
          </div>
          <nav className="space-y-2">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
        </Sheet>
      </div>
    </>
  );
}