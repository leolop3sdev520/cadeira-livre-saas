import type { FastifyInstance } from "fastify";
import { getAvailabilitySchema } from "./dtos/availability.dto.ts";
import { AvailabilityRepository } from "./database/availability.repository.ts";
import { AvailabilityService } from "./domain/availability.service.ts";

export async function availabilityRoutes(app: FastifyInstance) {
  const repository = new AvailabilityRepository();
  const service = new AvailabilityService();

  const getBarbershopId = (
    headers: Record<string, string | string[] | undefined>,
  ) => {
    const id = headers["x-barbershop-id"];
    if (!id || typeof id !== "string")
      throw Object.assign(new Error("Header x-barbershop-id obrigatório."), {
        statusCode: 401,
      });
    return id;
  };

  app.get("/api/v1/availability", async (request, reply) => {
    const barbershopId = getBarbershopId(request.headers);

    // Valida os Query Params
    const { professionalId, serviceId, date } = getAvailabilitySchema.parse(
      request.query,
    );

    // 1. Busca a duração do serviço
    const serviceData = await repository.getServiceDuration(
      barbershopId,
      serviceId,
    );
    if (!serviceData)
      throw Object.assign(new Error("Serviço não encontrado."), {
        statusCode: 404,
      });

    // 2. Descobre qual é o dia da semana da data pedida (0=Domingo, 1=Segunda...)
    // O T12:00:00 evita bugs de fuso horário que poderiam voltar um dia.
    const weekday = new Date(`${date}T12:00:00`).getDay();

    // 3. Busca a jornada de trabalho e os agendamentos
    const workingHours = await repository.getWorkingHours(
      barbershopId,
      professionalId,
      weekday,
    );
    if (!workingHours) {
      return reply.status(200).send({ slots: [] }); // Profissional não trabalha neste dia
    }

    const appointments = await repository.getAppointmentsByDay(
      professionalId,
      date,
    );

    // 4. Gera os slots livres
    const slots = service.generateSlots(
      date,
      serviceData.duration_min,
      workingHours,
      appointments,
    );

    return reply.status(200).send({
      professionalId,
      serviceId,
      date,
      slots,
    });
  });
}
