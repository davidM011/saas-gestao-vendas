import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard");
  const tenantId = req.auth?.user?.tenantId;

  if (isDashboardRoute && !tenantId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};