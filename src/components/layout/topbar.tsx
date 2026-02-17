"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function Topbar() {
  const { data } = useSession();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;

    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  function toggleTheme() {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-2 border-b bg-background/90 px-4 backdrop-blur lg:px-6">
      <Button variant="secondary" size="sm" onClick={toggleTheme} type="button">
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <DropdownMenu label={data?.user?.name ?? "Usuario"}>
        <div className="px-3 py-2 text-xs text-muted-foreground">{data?.user?.email}</div>
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>Sair</DropdownMenuItem>
      </DropdownMenu>
    </header>
  );
}