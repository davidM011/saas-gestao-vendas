import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("E-mail invalido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  tenantName: z.string().min(2, "Nome da empresa deve ter ao menos 2 caracteres"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail invalido"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20, "Token invalido"),
  tenantId: z.string().uuid("Tenant invalido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;