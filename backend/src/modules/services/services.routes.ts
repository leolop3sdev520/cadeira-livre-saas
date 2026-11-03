import type { FastifyInstance, FastifyRequest } from "fastify";
import { createServiceSchema } from "./dtos/service.dto.ts";
import { ServicesRepository } from "./database/services.repository.ts";
import { sql } from "../../shared/db/index.ts"; // <-- IMPORTANTE: Adicionado para a rota de toggle

export async function servicesRoutes(app: FastifyInstance) {
  const repository = new ServicesRepository();

  const getBarbershopIdFromContext = (request: FastifyRequest) => {
    if (request.user) return request.user.barbershop_id;
    const id = request.headers["x-barbershop-id"];
    if (!id || typeof id !== "string")
      throw Object.assign(
        new Error("Identificação da barbearia é obrigatória."),
        { statusCode: 401 },
      );
    return id;
  };

  // POST (Criar)
  app.post("/api/v1/services", async (request, reply) => {
    const barbershopId = getBarbershopIdFromContext(request);
    const data = createServiceSchema.parse(request.body);
    const service = await repository.create(barbershopId, data);
    return reply.status(201).send(service);
  });

  // GET (Listar)
  app.get("/api/v1/services", async (request, reply) => {
    const barbershopId = getBarbershopIdFromContext(request);
    // Se for público, filtra apenas ativos. Se for painel, traz todos.
    const services = await repository.findAllByBarbershop(barbershopId);
    if (!request.user) {
      return reply.status(200).send(services.filter((s: any) => s.is_active));
    }
    return reply.status(200).send(services);
  });

  // PATCH (Editar dados)
  app.patch("/api/v1/services/:id", async (request, reply) => {
    const barbershopId = getBarbershopIdFromContext(request);
    const { id } = request.params as { id: string };
    const data = createServiceSchema.parse(request.body);

    const service = await repository.update(barbershopId, id, data);
    if (!service)
      throw Object.assign(new Error("Serviço não encontrado."), {
        statusCode: 404,
      });

    return reply.status(200).send(service);
  });

  // PATCH (Toggle Status - Ativar/Desativar) <-- NOVA ROTA AQUI
  app.patch("/api/v1/services/:id/toggle-status", async (request, reply) => {
    const barbershopId = getBarbershopIdFromContext(request);
    const { id } = request.params as { id: string };

    const [updated] = await sql`
      UPDATE services
      SET is_active = NOT is_active, updated_at = now()
      WHERE id = ${id} AND barbershop_id = ${barbershopId}
      RETURNING *
    `;

    if (!updated) {
      throw Object.assign(new Error("Serviço não encontrado."), {
        statusCode: 404,
      });
    }

    return reply.status(200).send(updated);
  });

  // DELETE (Soft Delete)
  app.delete("/api/v1/services/:id", async (request, reply) => {
    const barbershopId = getBarbershopIdFromContext(request);
    const { id } = request.params as { id: string };

    const service = await repository.softDelete(barbershopId, id);
    if (!service)
      throw Object.assign(new Error("Serviço não encontrado."), {
        statusCode: 404,
      });

    return reply.status(204).send(); // 204 = No Content (Sucesso)
  });
}
