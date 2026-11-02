import { sql } from "../../../shared/db/index.ts";
import type { CreateAppointmentDTO } from "../dtos/appointment.dto.ts";

export class AppointmentsRepository {
  async getService(barbershopId: string, serviceId: string) {
    const [service] = await sql<
      { duration_min: number; price_cents: number }[]
    >`
      SELECT duration_min, price_cents FROM services
      WHERE id = ${serviceId} AND barbershop_id = ${barbershopId} AND is_active = true
    `;
    return service;
  }

  async create(
    barbershopId: string,
    data: CreateAppointmentDTO,
    durationMin: number,
    priceCents: number,
  ) {
    const start = new Date(data.startTime);
    const end = new Date(start.getTime() + durationMin * 60000);

    // Se o banco disparar o erro 23P01 (EXCLUDE CONSTRAINT), ele cai direto no Error Handler
    const [appointment] = await sql`
      INSERT INTO appointments (
        barbershop_id, professional_id, service_id, 
        customer_name, customer_email, 
        start_time, end_time, duration_min, price_cents
      )
      VALUES (
        ${barbershopId}, ${data.professionalId}, ${data.serviceId},
        ${data.customerName}, ${data.customerEmail},
        ${start.toISOString()}, ${end.toISOString()}, ${durationMin}, ${priceCents}
      )
      RETURNING *
    `;
    return appointment;
  }

  async findById(barbershopId: string, appointmentId: string) {
    const [appointment] = await sql`
      SELECT * FROM appointments 
      WHERE id = ${appointmentId} AND barbershop_id = ${barbershopId}
    `;
    return appointment;
  }

  async cancel(appointmentId: string) {
    const [appointment] = await sql`
      UPDATE appointments 
      SET status = 'cancelled', cancelled_at = now(), updated_at = now()
      WHERE id = ${appointmentId}
      RETURNING *
    `;
    return appointment;
  }

  async findAllByBarbershop(barbershopId: string) {
    return sql`
      SELECT 
        a.*, 
        p.name as professional_name, 
        s.name as service_name
      FROM appointments a
      JOIN professionals p ON a.professional_id = p.id
      JOIN services s ON a.service_id = s.id
      WHERE a.barbershop_id = ${barbershopId}
      ORDER BY a.start_time ASC
    `;
  }
}
