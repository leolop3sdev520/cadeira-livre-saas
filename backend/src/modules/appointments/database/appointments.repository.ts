import { randomInt } from "node:crypto";
import { sql } from "../../../shared/db/index.ts";
import { env } from "../../../config/env.ts";
import type {
  CreateAppointmentDTO,
  RescheduleAppointmentDTO,
} from "../dtos/appointment.dto.ts";

function generateShortCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let index = 0; index < 6; index += 1) {
    result += chars.charAt(randomInt(chars.length));
  }
  return result;
}

export class AppointmentsRepository {
  async checkAvailability(
    barbershopId: string,
    startTime: Date,
    professionalId: string,
    durationMin: number,
  ): Promise<boolean> {
    const [result] = await sql<{ available: boolean }[]>`
      WITH requested AS (
        SELECT
          ${startTime.toISOString()}::timestamptz AS start_at,
          ${startTime.toISOString()}::timestamptz
            + (${durationMin} * interval '1 minute') AS end_at
      ),
      local_requested AS (
        SELECT
          start_at AT TIME ZONE ${env.BUSINESS_TIMEZONE} AS local_start,
          end_at AT TIME ZONE ${env.BUSINESS_TIMEZONE} AS local_end
        FROM requested
      )
      SELECT EXISTS (
        SELECT 1
        FROM working_hours wh
        JOIN professionals p ON p.id = wh.professional_id
        CROSS JOIN local_requested requested
        WHERE wh.professional_id = ${professionalId}
          AND p.barbershop_id = ${barbershopId}
          AND p.is_active = true
          AND wh.is_active = true
          AND wh.weekday = EXTRACT(DOW FROM requested.local_start)::integer
          AND requested.local_start::date = requested.local_end::date
          AND wh.start_time <= requested.local_start::time
          AND wh.end_time >= requested.local_end::time
      ) AS available
    `;

    return result?.available ?? false;
  }

  async findAvailableProfessional(
    barbershopId: string,
    startTime: Date,
    durationMin: number,
  ) {
    const [professional] = await sql<{ id: string }[]>`
      WITH requested AS (
        SELECT
          ${startTime.toISOString()}::timestamptz AS start_at,
          ${startTime.toISOString()}::timestamptz
            + (${durationMin} * interval '1 minute') AS end_at
      ),
      local_requested AS (
        SELECT
          start_at AT TIME ZONE ${env.BUSINESS_TIMEZONE} AS local_start,
          end_at AT TIME ZONE ${env.BUSINESS_TIMEZONE} AS local_end
        FROM requested
      )
      SELECT p.id
      FROM professionals p
      JOIN working_hours wh ON wh.professional_id = p.id
      CROSS JOIN requested
      CROSS JOIN local_requested
      WHERE p.barbershop_id = ${barbershopId}
        AND p.is_active = true
        AND wh.is_active = true
        AND wh.weekday = EXTRACT(DOW FROM local_requested.local_start)::integer
        AND local_requested.local_start::date = local_requested.local_end::date
        AND wh.start_time <= local_requested.local_start::time
        AND wh.end_time >= local_requested.local_end::time
        AND NOT EXISTS (
          SELECT 1
          FROM appointments a
          WHERE a.professional_id = p.id
            AND a.status = 'confirmed'
            AND a.start_time < requested.end_at
            AND a.end_time > requested.start_at
        )
      ORDER BY p.created_at, p.id
      LIMIT 1
    `;
    return professional;
  }

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

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const management_token = generateShortCode();
      const [appointment] = await sql`
        WITH inserted AS (
        INSERT INTO appointments (
          barbershop_id, professional_id, service_id,
          customer_name, customer_email,
          start_time, end_time, duration_min, price_cents, management_token
        )
        VALUES (
          ${barbershopId}, ${data.professionalId}, ${data.serviceId},
          ${data.customerName}, ${data.customerEmail},
          ${start.toISOString()}, ${end.toISOString()}, ${durationMin},
          ${priceCents}, ${management_token}
        )
        ON CONFLICT (management_token) DO NOTHING
        RETURNING *
        )
        SELECT inserted.*, p.name AS professional_name
        FROM inserted
        JOIN professionals p ON p.id = inserted.professional_id
      `;
      if (appointment) return appointment;
    }

    throw new Error("Não foi possível gerar um código único para o agendamento.");
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

  async reschedule(
    barbershopId: string,
    appointmentId: string,
    data: RescheduleAppointmentDTO,
  ) {
    const start = new Date(data.startTime);
    const [appointment] = await sql`
      UPDATE appointments
      SET
        start_time = ${start.toISOString()},
        end_time = ${start.toISOString()}::timestamptz
          + (duration_min * interval '1 minute'),
        updated_at = now()
      WHERE id = ${appointmentId}
        AND barbershop_id = ${barbershopId}
        AND status = 'confirmed'
      RETURNING *
    `;
    return appointment;
  }

  async findAllByBarbershop(barbershopId: string) {
    return sql`
      SELECT 
        a.id,
        a.barbershop_id,
        a.professional_id,
        a.service_id,
        a.customer_name,
        a.customer_email,
        a.start_time,
        a.end_time,
        a.duration_min,
        a.price_cents,
        a.status,
        a.created_at,
        a.updated_at,
        a.cancelled_at,
        p.name as professional_name, 
        s.name as service_name
      FROM appointments a
      JOIN professionals p ON a.professional_id = p.id
      JOIN services s ON a.service_id = s.id
      WHERE a.barbershop_id = ${barbershopId}
      ORDER BY a.start_time ASC
    `;
  }

  async findByManagementToken(
    barbershopId: string,
    email: string,
    managementToken: string,
  ) {
    return sql`
      SELECT
        a.id,
        a.start_time,
        a.end_time,
        s.name AS service_name,
        p.name AS professional_name
      FROM appointments a
      JOIN services s ON s.id = a.service_id
      JOIN professionals p ON p.id = a.professional_id
      WHERE a.barbershop_id = ${barbershopId}
        AND LOWER(a.customer_email) = LOWER(${email})
        AND a.management_token = ${managementToken}
        AND a.status = 'confirmed'
        AND a.start_time > now()
      ORDER BY a.start_time ASC
    `;
  }
}
