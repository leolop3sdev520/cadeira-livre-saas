import type { FastifyInstance } from "fastify";
import { CustomersRepository } from "./database/customers.repository.ts";

export async function customersRoutes(app: FastifyInstance) {
  const repository = new CustomersRepository();

  app.get("/api/v1/customers", async (request, reply) => {
    const barbershopId = request.user?.barbershop_id;
    if (!barbershopId) {
      throw Object.assign(new Error("Não autorizado."), { statusCode: 401 });
    }

    const customers = await repository.findAllByBarbershop(barbershopId);
    return reply.status(200).send(customers);
  });
}
