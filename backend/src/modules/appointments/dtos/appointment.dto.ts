import { z } from "zod";

export const createAppointmentSchema = z.object({
  professionalId: z.string().uuid(),
  serviceId: z.string().uuid(),
  customerName: z.string().min(3, "O nome deve ter pelo menos 3 letras."),
  customerEmail: z.string().email("E-mail inválido."),
  startTime: z
    .string()
    .datetime({
      offset: true,
      message:
        "A data deve estar no formato ISO 8601 com fuso horário (ex: 2026-11-02T09:00:00-03:00).",
    }),
});

export type CreateAppointmentDTO = z.infer<typeof createAppointmentSchema>;

export const cancelAppointmentSchema = z.object({
  reason: z.string().optional(),
});
