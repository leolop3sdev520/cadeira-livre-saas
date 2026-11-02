import type { FastifyInstance, FastifyRequest } from "fastify";
import { createServiceSchema } from "./dtos/service.dto.ts";
import { ServicesRepository } from "./database/services.repository.ts";

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

  // POST (Protegido - Apenas Admin logado cria)
  app.post("/api/v1/services", async (request, reply) => {
    const barbershopId = getBarbershopIdFromContext(request);
    const data = createServiceSchema.parse(request.body);
    const service = await repository.create(barbershopId, data);
    return reply.status(201).send(service);
  });

  // GET (Público - Cliente final vê o catálogo)
  app.get("/api/v1/services", async (request, reply) => {
    const barbershopId = getBarbershopIdFromContext(request);
    const services = await repository.findAllByBarbershop(barbershopId);
    return reply.status(200).send(services);
  });
}
