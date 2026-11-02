import { z } from "zod";

export const createProfessionalSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 letras."),
  email: z.string().email("E-mail inválido."),
  phone: z.string().optional(),
});

export type CreateProfessionalDTO = z.infer<typeof createProfessionalSchema>;

export const createWorkingHoursSchema = z
  .object({
    weekday: z
      .number()
      .int()
      .min(0)
      .max(6, "Use 0 para Domingo e 6 para Sábado."),
    start_time: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Formato de hora inválido. Use HH:mm.",
      ),
    end_time: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Formato de hora inválido. Use HH:mm.",
      ),
  })
  .refine((data) => data.start_time < data.end_time, {
    message: "A hora de início deve ser menor que a hora de término.",
    path: ["end_time"],
  });

export type CreateWorkingHoursDTO = z.infer<typeof createWorkingHoursSchema>;
