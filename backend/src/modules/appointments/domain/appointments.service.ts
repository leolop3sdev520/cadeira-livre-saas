import { env } from "../../../config/env.ts";

export class AppointmentsService {
  validateCancellation(startTime: Date) {
    const now = new Date();
    const diffInHours =
      (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffInHours < env.CANCELLATION_MIN_HOURS) {
      throw Object.assign(
        new Error(
          `O cancelamento exige antecedência mínima de ${env.CANCELLATION_MIN_HOURS} horas.`,
        ),
        { statusCode: 422 }, // Unprocessable Entity (Regra de negócio)
      );
    }
  }
}
