import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  createProfessionalSchema,
  createWorkingHoursSchema,
} from "./dtos/professional.dto.ts";
import { ProfessionalsRepository } from "./database/professionals.repository.ts";
import { sql } from "../../shared/db/index.ts";

export async function professionalsRoutes(app: FastifyInstance) {
  const repository = new ProfessionalsRepository();

  // Função para pegar o ID do Barbershop via JWT ou via Header (para o cliente final)
  const getBarbershopIdFromContext = (request: FastifyRequest) => {
    if (request.user) return request.user.barbershop_id;

    const id = request.headers["x-barbershop-id"];
    if (!id || typeof id !== "string") {
      throw Object.assign(
        new Error(
          "O header x-barbershop-id é obrigatório para rotas públicas.",
        ),
        { statusCode: 401 },
      );
    }
    return id;
  };

  // POST /api/v1/professionals
  app.post("/api/v1/professionals", async (request, reply) => {
    const barbershopId = getBarbershopIdFromContext(request);
    const data = createProfessionalSchema.parse(request.body);

    const professional = await repository.create(barbershopId, data);
    return reply.status(201).send(professional);
  });

  // GET /api/v1/professionals
  app.get("/api/v1/professionals", async (request, reply) => {
    const barbershopId = getBarbershopIdFromContext(request);
    const professionals = await repository.findAllByBarbershop(barbershopId);
    return reply.status(200).send(professionals);
  });

  // POST /api/v1/professionals/:id/working-hours
  app.post(
    "/api/v1/professionals/:id/working-hours",
    async (request, reply) => {
      const barbershopId = getBarbershopIdFromContext(request);
      const { id } = request.params as { id: string };
      const data = createWorkingHoursSchema.parse(request.body);

      const [exists] = await sql`
      SELECT id FROM professionals 
      WHERE id = ${id} AND barbershop_id = ${barbershopId}
    `;
      if (!exists) {
        throw Object.assign(
          new Error("Profissional não encontrado nesta barbearia."),
          { statusCode: 404 },
        );
      }

      const workingHour = await repository.addWorkingHours(id, data);
      return reply.status(201).send(workingHour);
    },
  );
}
