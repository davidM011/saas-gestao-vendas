import { z } from "zod";

export const createSaleSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().min(1, "Produto obrigatorio"),
          quantity: z.number({ invalid_type_error: "Quantidade invalida" }).int("Quantidade deve ser inteira").positive("Quantidade deve ser maior que zero"),
        }),
      )
      .min(1, "Adicione ao menos 1 item"),
    paymentType: z.enum(["CASH", "CREDIT"]),
    dueDate: z.string().datetime().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentType === "CREDIT" && !data.dueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dueDate"],
        message: "Data de vencimento obrigatoria para venda a prazo",
      });
    }

    if (data.paymentType === "CREDIT" && data.dueDate) {
      const dueDate = new Date(data.dueDate);
      if (Number.isNaN(dueDate.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dueDate"],
          message: "Data de vencimento invalida",
        });
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dueDate"],
          message: "Data de vencimento nao pode ser no passado",
        });
      }
    }
  });

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
