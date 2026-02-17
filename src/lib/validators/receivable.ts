import { z } from "zod";

export const receivableFilterSchema = z.object({
  filter: z.enum(["all", "overdue", "upcoming", "paid"]).default("all"),
  daysAhead: z.coerce.number().int().min(1).max(60).default(7),
});

export const receivableIdSchema = z.object({
  id: z.string().uuid("ID de conta invalido"),
});

export type ReceivableFilterInput = z.infer<typeof receivableFilterSchema>;