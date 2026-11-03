import { sql } from "../../../shared/db/index.ts";
import type { CreateServiceDTO } from "../dtos/service.dto.ts";

export class ServicesRepository {
  async create(barbershopId: string, data: CreateServiceDTO) {
    const [service] = await sql`
      INSERT INTO services (barbershop_id, name, duration_min, price_cents)
      VALUES (${barbershopId}, ${data.name}, ${data.duration_min}, ${data.price_cents})
      RETURNING *
    `;
    return service;
  }

  async findAllByBarbershop(barbershopId: string) {
    // Traz todos (ativos e inativos) para o painel
    return sql`
      SELECT * FROM services
      WHERE barbershop_id = ${barbershopId}
      ORDER BY name ASC
    `;
  }

  async update(
    barbershopId: string,
    serviceId: string,
    data: CreateServiceDTO,
  ) {
    const [service] = await sql`
      UPDATE services
      SET name = ${data.name}, duration_min = ${data.duration_min}, price_cents = ${data.price_cents}, updated_at = now()
      WHERE id = ${serviceId} AND barbershop_id = ${barbershopId}
      RETURNING *
    `;
    return service;
  }

  async softDelete(barbershopId: string, serviceId: string) {
    const [service] = await sql`
      UPDATE services
      SET is_active = false, updated_at = now()
      WHERE id = ${serviceId} AND barbershop_id = ${barbershopId}
      RETURNING *
    `;
    return service;
  }
}
