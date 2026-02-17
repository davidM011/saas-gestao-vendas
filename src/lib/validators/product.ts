import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  costPrice: z.number({ invalid_type_error: "Preco de custo invalido" }).nonnegative("Preco de custo nao pode ser negativo"),
  salePrice: z.number({ invalid_type_error: "Preco de venda invalido" }).nonnegative("Preco de venda nao pode ser negativo"),
  stock: z.number({ invalid_type_error: "Estoque invalido" }).int("Estoque deve ser inteiro").nonnegative("Estoque nao pode ser negativo"),
  minStock: z.number({ invalid_type_error: "Estoque minimo invalido" }).int("Estoque minimo deve ser inteiro").nonnegative("Estoque minimo nao pode ser negativo").default(0),
});

export const updateProductSchema = createProductSchema;

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional().default(""),
});

const movementTypes = ["IN", "OUT", "ADJUST"] as const;

export const createStockMovementSchema = z
  .object({
    productId: z.string().min(1, "Produto obrigatorio"),
    type: z.enum(movementTypes),
    quantity: z.number({ invalid_type_error: "Quantidade invalida" }).int("Quantidade deve ser inteira").positive("Quantidade deve ser maior que zero").optional(),
    targetStock: z.number({ invalid_type_error: "Estoque alvo invalido" }).int("Estoque alvo deve ser inteiro").nonnegative("Estoque alvo nao pode ser negativo").optional(),
    reason: z.string().max(200, "Motivo muito longo").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "ADJUST") {
      if (typeof data.targetStock !== "number") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetStock"],
          message: "Estoque alvo e obrigatorio para ajuste",
        });
      }
      return;
    }

    if (typeof data.quantity !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quantity"],
        message: "Quantidade e obrigatoria para entrada/saida",
      });
    }
  });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type ListProductsQueryInput = z.infer<typeof listProductsQuerySchema>;
