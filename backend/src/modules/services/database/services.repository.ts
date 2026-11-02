import { sql } from "../../../shared/db/index.ts";
import type {
  CreateServiceDTO,
  ServiceResponseDTO,
} from "../dtos/service.dto.ts";

export class ServicesRepository {
  // Cria um serviço amarrado a uma barbearia
  async create(
    barbershopId: string,
    data: CreateServiceDTO,
  ): Promise<ServiceResponseDTO> {
    const [service] = await sql<ServiceResponseDTO[]>`
      INSERT INTO services (barbershop_id, name, duration_min, price_cents)
      VALUES (${barbershopId}, ${data.name}, ${data.duration_min}, ${data.price_cents})
      RETURNING *
    `;
    return service!;
  }

  // Lista os serviços de uma barbearia específica
  async findAllByBarbershop(
    barbershopId: string,
  ): Promise<ServiceResponseDTO[]> {
    return sql<ServiceResponseDTO[]>`
      SELECT * FROM services
      WHERE barbershop_id = ${barbershopId} AND is_active = true
      ORDER BY name ASC
    `;
  }
}
