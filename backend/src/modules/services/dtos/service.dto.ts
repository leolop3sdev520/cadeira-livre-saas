import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 letras."),
  duration_min: z.number().int().positive("A duração deve ser maior que zero."),
  price_cents: z.number().int().nonnegative("O preço não pode ser negativo."),
});

export type CreateServiceDTO = z.infer<typeof createServiceSchema>;

export const serviceResponseSchema = z.object({
  id: z.string().uuid(),
  barbershop_id: z.string().uuid(),
  name: z.string(),
  duration_min: z.number(),
  price_cents: z.number(),
  is_active: z.boolean(),
  created_at: z.date(),
});

export type ServiceResponseDTO = z.infer<typeof serviceResponseSchema>;
