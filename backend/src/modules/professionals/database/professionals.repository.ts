import { sql } from "../../../shared/db/index.ts";
import type {
  CreateProfessionalDTO,
  CreateWorkingHoursDTO,
} from "../dtos/professional.dto.ts";

export class ProfessionalsRepository {
  async create(barbershopId: string, data: CreateProfessionalDTO) {
    const [professional] = await sql`
      INSERT INTO professionals (barbershop_id, name, email, phone)
      VALUES (${barbershopId}, ${data.name}, ${data.email}, ${data.phone ?? null})
      RETURNING *
    `;
    return professional;
  }

  async findAllByBarbershop(barbershopId: string) {
    return sql`
      SELECT * FROM professionals
      WHERE barbershop_id = ${barbershopId}
      ORDER BY name ASC
    `;
  }

  async update(
    barbershopId: string,
    professionalId: string,
    data: CreateProfessionalDTO,
  ) {
    const [professional] = await sql`
      UPDATE professionals
      SET name = ${data.name}, email = ${data.email}, phone = ${data.phone ?? null}, updated_at = now()
      WHERE id = ${professionalId} AND barbershop_id = ${barbershopId}
      RETURNING *
    `;
    return professional;
  }

  async softDelete(barbershopId: string, professionalId: string) {
    const [professional] = await sql`
      UPDATE professionals
      SET is_active = false, updated_at = now()
      WHERE id = ${professionalId} AND barbershop_id = ${barbershopId}
      RETURNING *
    `;
    return professional;
  }

  async addWorkingHours(professionalId: string, data: CreateWorkingHoursDTO) {
    const [workingHour] = await sql`
      INSERT INTO working_hours (professional_id, weekday, start_time, end_time)
      VALUES (${professionalId}, ${data.weekday}, ${data.start_time}, ${data.end_time})
      RETURNING *
    `;
    return workingHour;
  }

  async findWorkingHours(professionalId: string) {
    return sql`
      SELECT *
      FROM working_hours
      WHERE professional_id = ${professionalId}
      ORDER BY weekday ASC, start_time ASC
    `;
  }

  async removeWorkingHours(professionalId: string, hourId: string) {
    const [workingHour] = await sql`
      DELETE FROM working_hours
      WHERE id = ${hourId} AND professional_id = ${professionalId}
      RETURNING *
    `;
    return workingHour;
  }
}
