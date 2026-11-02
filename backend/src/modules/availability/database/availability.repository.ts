import { sql } from "../../../shared/db/index.ts";

export class AvailabilityRepository {
  // 1. Busca a duração do serviço (e garante que pertence à barbearia)
  async getServiceDuration(barbershopId: string, serviceId: string) {
    const [service] = await sql<{ duration_min: number }[]>`
      SELECT duration_min FROM services
      WHERE id = ${serviceId} AND barbershop_id = ${barbershopId} AND is_active = true
    `;
    return service;
  }

  // 2. Busca o horário de trabalho do profissional no dia da semana (0 a 6)
  async getWorkingHours(
    barbershopId: string,
    professionalId: string,
    weekday: number,
  ) {
    const [hours] = await sql<{ start_time: string; end_time: string }[]>`
      SELECT start_time, end_time FROM working_hours
      WHERE professional_id = ${professionalId} 
        AND weekday = ${weekday} 
        AND is_active = true
        AND professional_id IN (SELECT id FROM professionals WHERE barbershop_id = ${barbershopId})
    `;
    return hours;
  }

  // 3. Busca os agendamentos confirmados do profissional naquele dia (ignorando fuso do servidor)
  async getAppointmentsByDay(professionalId: string, date: string) {
    return sql<{ start_time: string; end_time: string }[]>`
      SELECT start_time, end_time FROM appointments
      WHERE professional_id = ${professionalId}
        AND status = 'confirmed'
        AND (start_time AT TIME ZONE 'America/Sao_Paulo')::date = ${date}::date
    `;
  }
}
