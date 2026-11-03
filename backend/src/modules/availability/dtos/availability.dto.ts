import { z } from "zod";

export const getAvailabilitySchema = z.object({
  professionalId: z
    .string()
    .uuid("O professionalId deve ser um UUID válido.")
    .or(z.literal("any")),
  serviceId: z.string().uuid("O serviceId deve ser um UUID válido."),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "A data deve estar no formato YYYY-MM-DD."),
});

export type GetAvailabilityDTO = z.infer<typeof getAvailabilitySchema>;
