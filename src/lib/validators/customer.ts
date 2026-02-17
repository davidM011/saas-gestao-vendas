import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.string().email("E-mail invalido").optional().or(z.literal("")),
});

export const updateCustomerSchema = createCustomerSchema;

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;