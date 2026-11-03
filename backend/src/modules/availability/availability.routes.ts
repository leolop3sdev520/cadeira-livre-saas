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

    const professionalIds =
      professionalId === "any"
        ? (await repository.getActiveProfessionals(barbershopId)).map(
            (professional) => professional.id,
          )
        : [professionalId];

    const slotsByProfessional = await Promise.all(
      professionalIds.map(async (id) => {
        const [workingHours, appointments] = await Promise.all([
          repository.getWorkingHours(barbershopId, id, weekday),
          repository.getAppointmentsByDay(id, date),
        ]);
        return service.generateSlots(
          date,
          serviceData.duration_min,
          workingHours,
          appointments,
        );
      }),
    );

    const slots = [
      ...new Map(
        slotsByProfessional
          .flat()
          .map((slot) => [slot.startTime, slot] as const),
      ).values(),
    ].sort((a, b) => a.startTime.localeCompare(b.startTime));

    return reply.status(200).send({
      professionalId,
      serviceId,
      date,
      slots,
    });
  });
}
