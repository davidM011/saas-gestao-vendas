import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Providers } from "@/components/providers";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  return (
    <Providers>
      <div className="min-h-screen bg-muted/30 lg:flex">
        <AppSidebar />
        <div className="flex-1">
          <Topbar />
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </Providers>
  );
}