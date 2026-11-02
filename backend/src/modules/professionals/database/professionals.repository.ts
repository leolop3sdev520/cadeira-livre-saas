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
      WHERE barbershop_id = ${barbershopId} AND is_active = true
      ORDER BY name ASC
    `;
  }

  async addWorkingHours(professionalId: string, data: CreateWorkingHoursDTO) {
    const [workingHour] = await sql`
      INSERT INTO working_hours (professional_id, weekday, start_time, end_time)
      VALUES (${professionalId}, ${data.weekday}, ${data.start_time}, ${data.end_time})
      RETURNING *
    `;
    return workingHour;
  }
}
