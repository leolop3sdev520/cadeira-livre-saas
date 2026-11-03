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

  const getBarbershopIdFromContext = (
    request: FastifyRequest,
    preferHeader = false,
  ) => {
    const headerId = request.headers["x-barbershop-id"];
    if (preferHeader && typeof headerId === "string" && headerId.trim()) {
      return headerId.trim();
    }
    if (request.user) return request.user.barbershop_id;
    if (!headerId || typeof headerId !== "string") {
      throw Object.assign(
        new Error(
          "O header x-barbershop-id é obrigatório para rotas públicas.",
        ),
        { statusCode: 401 },
      );
    }
    return headerId;
  };

  // POST (Criar)
  app.post("/api/v1/professionals", async (request, reply) => {
    const barbershopId = getBarbershopIdFromContext(request);
    const data = createProfessionalSchema.parse(request.body);

    const professional = await sql.begin(async (transaction) => {
      const [barbershop] = await transaction<{ plan: "solo" | "equipe" }[]>`
        SELECT plan
        FROM barbershops
        WHERE id = ${barbershopId}
        FOR UPDATE
      `;
      if (!barbershop) {
        throw Object.assign(new Error("Barbearia não encontrada."), {
          statusCode: 404,
        });
      }

      const [activeProfessionals] = await transaction<{ count: number }[]>`
        SELECT COUNT(*)::int AS count
        FROM professionals
        WHERE barbershop_id = ${barbershopId}
          AND is_active = true
      `;
      const activeCount = activeProfessionals?.count ?? 0;

      if (barbershop.plan === "solo" && activeCount >= 1) {
        throw Object.assign(
          new Error(
            "O Plano Solo permite apenas 1 profissional. Faça upgrade para o Plano Equipe.",
          ),
          { statusCode: 403 },
        );
      }
      if (barbershop.plan === "equipe" && activeCount >= 5) {
        throw Object.assign(
          new Error(
            "O Plano Equipe permite até 5 profissionais. Entre em contato para upgrade.",
          ),
          { statusCode: 403 },
        );
      }

      const [createdProfessional] = await transaction`
        INSERT INTO professionals (barbershop_id, name, email, phone)
        VALUES (
          ${barbershopId},
          ${data.name},
          ${data.email},
          ${data.phone ?? null}
        )
        RETURNING *
      `;
      return createdProfessional;
    });

    return reply.status(201).send(professional);
  });

  // GET (Listar)
  app.get("/api/v1/professionals", async (request, reply) => {
    const headerId = request.headers["x-barbershop-id"];
    const hasPublicBarbershopHeader =
      typeof headerId === "string" && headerId.trim().length > 0;
    const barbershopId = getBarbershopIdFromContext(request, true);

    // A presença do header identifica consultas da vitrine, mesmo se o navegador
    // enviar um JWT salvo de uma sessão anterior.
    if (hasPublicBarbershopHeader || !request.user) {
      const professionals = await sql`
        SELECT *
        FROM professionals
        WHERE barbershop_id = ${barbershopId}
          AND is_active = true
        ORDER BY name ASC
      `;
      return reply.status(200).send(professionals);
    }

    const professionals = await repository.findAllByBarbershop(barbershopId);
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

      const updated = await sql.begin(async (transaction) => {
        const [barbershop] = await transaction<{
          plan: "solo" | "equipe";
        }[]>`
          SELECT plan
          FROM barbershops
          WHERE id = ${barbershopId}
          FOR UPDATE
        `;
        if (!barbershop) {
          throw Object.assign(new Error("Barbearia não encontrada."), {
            statusCode: 404,
          });
        }

        const [professional] = await transaction<{
          id: string;
          is_active: boolean;
        }[]>`
          SELECT id, is_active
          FROM professionals
          WHERE id = ${id}
            AND barbershop_id = ${barbershopId}
          FOR UPDATE
        `;
        if (!professional) {
          throw Object.assign(new Error("Profissional não encontrado."), {
            statusCode: 404,
          });
        }

        if (!professional.is_active) {
          const [activeProfessionals] = await transaction<{
            count: number;
          }[]>`
            SELECT COUNT(*)::int AS count
            FROM professionals
            WHERE barbershop_id = ${barbershopId}
              AND is_active = true
          `;
          const activeCount = activeProfessionals?.count ?? 0;
          const limit = barbershop.plan === "solo" ? 1 : 5;

          if (activeCount >= limit) {
            const message =
              barbershop.plan === "solo"
                ? "Limite de profissionais ativos atingido: o Plano Solo permite 1 profissional. Desative o profissional ativo ou faça upgrade para reativar este."
                : "Limite de profissionais ativos atingido: o Plano Equipe permite até 5 profissionais. Desative um profissional antes de reativar este.";
            throw Object.assign(new Error(message), { statusCode: 403 });
          }
        }

        const [updatedProfessional] = await transaction`
          UPDATE professionals
          SET is_active = NOT is_active, updated_at = now()
          WHERE id = ${id}
            AND barbershop_id = ${barbershopId}
          RETURNING *
        `;
        return updatedProfessional;
      });

      if (!updated) {
        throw Object.assign(new Error("Não foi possível atualizar o profissional."), {
          statusCode: 500,
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
