import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL obrigatoria"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET deve ter ao menos 16 caracteres"),
  AUTH_URL: z.string().url("AUTH_URL invalida"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_URL: process.env.AUTH_URL,
});

