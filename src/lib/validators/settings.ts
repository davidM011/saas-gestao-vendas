import { z } from "zod";

export const updateTenantSchema = z.object({
  name: z.string().min(2, "Nome da empresa deve ter ao menos 2 caracteres"),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Senha atual invalida"),
  newPassword: z.string().min(6, "Nova senha deve ter ao menos 6 caracteres"),
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;