import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const authConfig: NextAuthConfig = {
  secret: env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
          include: { memberships: true },
        });

        if (!user) return null;

        const validPassword = await compare(parsed.data.password, user.password);
        if (!validPassword) return null;

        const membership = user.memberships[0];
        if (!membership?.tenantId) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: membership.tenantId,
          role: membership.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.userId = user.id;
        token.tenantId = (user as { tenantId?: string }).tenantId;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.tenantId = token.tenantId as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    authorized: async ({ auth, request }) => {
      const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
      if (!isDashboard) return true;
      return !!auth?.user?.tenantId;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
