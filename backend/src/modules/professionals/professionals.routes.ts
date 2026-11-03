import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  createProfessionalSchema,
  createWorkingHoursSchema,
} from "./dtos/professional.dto.ts";
import { ProfessionalsRepository } from "./database/professionals.repository.ts";
import { sql } from "../../shared/db/index.ts";

export async function professionalsRoutes(app: FastifyInstance) {
  const repository = new ProfessionalsRepository();

  const requireBarbershopId = (request: FastifyRequest) => {
    if (request.user?.barbershop_id) return request.user.barbershop_id;
    throw Object.assign(new Error("Não autorizado."), { statusCode: 401 });
  };

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

  // POST (Criar)
  app.post("/api/v1/professionals", async (request, reply) => {
    const barbershopId = getBarbershopIdFromContext(request);
    const data = createProfessionalSchema.parse(request.body);
    const professional = await repository.create(barbershopId, data);
    return reply.status(201).send(professional);
  });

  // GET (Listar)
  app.get("/api/v1/professionals", async (request, reply) => {
    const barbershopId = getBarbershopIdFromContext(request);
    const professionals = await repository.findAllByBarbershop(barbershopId);

    // Se for público (vitrine), filtra apenas ativos. Se for painel, traz todos.
    if (!request.user) {
      return reply
        .status(200)
        .send(professionals.filter((p: any) => p.is_active));
    }
    return reply.status(200).send(professionals);
  });

  // PATCH (Editar)
  app.patch("/api/v1/professionals/:id", async (request, reply) => {
    const barbershopId = getBarbershopIdFromContext(request);
    const { id } = request.params as { id: string };
    const data = createProfessionalSchema.parse(request.body);

    const professional = await repository.update(barbershopId, id, data);
    if (!professional) {
      throw Object.assign(new Error("Profissional não encontrado."), {
        statusCode: 404,
      });
    }
    return reply.status(200).send(professional);
  });

  // PATCH (Toggle Status - Ativar/Desativar)
  app.patch(
    "/api/v1/professionals/:id/toggle-status",
    async (request, reply) => {
      const barbershopId = getBarbershopIdFromContext(request);
      const { id } = request.params as { id: string };

      const [updated] = await sql`
      UPDATE professionals
      SET is_active = NOT is_active, updated_at = now()
      WHERE id = ${id} AND barbershop_id = ${barbershopId}
      RETURNING *
    `;

      if (!updated) {
        throw Object.assign(new Error("Profissional não encontrado."), {
          statusCode: 404,
        });
      }
      return reply.status(200).send(updated);
    },
  );

  // DELETE (Soft Delete) - Mantido por compatibilidade
  app.delete("/api/v1/professionals/:id", async (request, reply) => {
    const barbershopId = getBarbershopIdFromContext(request);
    const { id } = request.params as { id: string };

    const professional = await repository.softDelete(barbershopId, id);
    if (!professional) {
      throw Object.assign(new Error("Profissional não encontrado."), {
        statusCode: 404,
      });
    }
    return reply.status(204).send();
  });

  // POST (Adicionar Jornada de Trabalho)
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

  app.get(
    "/api/v1/professionals/:id/working-hours",
    async (request, reply) => {
      const barbershopId = requireBarbershopId(request);
      const { id } = request.params as { id: string };
      const [professional] = await sql`
        SELECT id
        FROM professionals
        WHERE id = ${id} AND barbershop_id = ${barbershopId}
      `;

      if (!professional) {
        throw Object.assign(
          new Error("Profissional não encontrado nesta barbearia."),
          { statusCode: 404 },
        );
      }

      const workingHours = await repository.findWorkingHours(id);
      return reply.status(200).send(workingHours);
    },
  );

  app.delete(
    "/api/v1/professionals/:id/working-hours/:hourId",
    async (request, reply) => {
      const barbershopId = requireBarbershopId(request);
      const { id, hourId } = request.params as {
        id: string;
        hourId: string;
      };
      const [professional] = await sql`
        SELECT id
        FROM professionals
        WHERE id = ${id} AND barbershop_id = ${barbershopId}
      `;

      if (!professional) {
        throw Object.assign(
          new Error("Profissional não encontrado nesta barbearia."),
          { statusCode: 404 },
        );
      }

      const workingHour = await repository.removeWorkingHours(id, hourId);
      if (!workingHour) {
        throw Object.assign(new Error("Turno não encontrado."), {
          statusCode: 404,
        });
      }

      return reply.status(204).send();
    },
  );
}
