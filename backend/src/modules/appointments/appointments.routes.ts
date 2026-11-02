import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  createAppointmentSchema,
  cancelAppointmentSchema,
} from "./dtos/appointment.dto.ts";
import { AppointmentsRepository } from "./database/appointments.repository.ts";
import { AppointmentsService } from "./domain/appointments.service.ts";

export async function appointmentsRoutes(app: FastifyInstance) {
  const repository = new AppointmentsRepository();
  const service = new AppointmentsService();

  // Função mágica que decide de onde pegar o ID
  const getBarbershopIdFromContext = (request: FastifyRequest) => {
    // Se o usuário está logado (JWT injetou o user)
    if (request.user) {
      return request.user.barbershop_id;
    }
    // Se for o cliente final agendando, pega do header
    const id = request.headers["x-barbershop-id"];
    if (!id || typeof id !== "string") {
      throw Object.assign(
        new Error("Identificação da barbearia é obrigatória."),
        { statusCode: 401 },
      );
    }
    return id;
  };

  // POST /api/v1/appointments (Público - Cliente agenda)
  app.post("/api/v1/appointments", async (request, reply) => {
    const barbershopId = getBarbershopIdFromContext(request);
    const data = createAppointmentSchema.parse(request.body);

    const serviceData = await repository.getService(
      barbershopId,
      data.serviceId,
    );
    if (!serviceData)
      throw Object.assign(new Error("Serviço não encontrado."), {
        statusCode: 404,
      });

    const appointment = await repository.create(
      barbershopId,
      data,
      serviceData.duration_min,
      serviceData.price_cents,
    );
    return reply.status(201).send(appointment);
  });

  // GET /api/v1/appointments (Protegido - Painel do Barbeiro)
  app.get("/api/v1/appointments", async (request, reply) => {
    const barbershopId = getBarbershopIdFromContext(request);
    const appointments = await repository.findAllByBarbershop(barbershopId);
    return reply.status(200).send(appointments);
  });

  // PATCH /api/v1/appointments/:id/cancel (Protegido)
  app.patch("/api/v1/appointments/:id/cancel", async (request, reply) => {
    const barbershopId = getBarbershopIdFromContext(request);
    const { id } = request.params as { id: string };
    cancelAppointmentSchema.parse(request.body || {});

    const appointment = (await repository.findById(barbershopId, id)) as any;
    if (!appointment)
      throw Object.assign(new Error("Agendamento não encontrado."), {
        statusCode: 404,
      });
    if (appointment.status !== "confirmed")
      throw Object.assign(
        new Error("Apenas agendamentos confirmados podem ser cancelados."),
        { statusCode: 422 },
      );

    service.validateCancellation(new Date(appointment.start_time));
    const cancelled = await repository.cancel(id);
    return reply.status(200).send(cancelled);
  });
}
