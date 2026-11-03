import type { FastifyInstance, FastifyRequest } from "fastify";
import { timingSafeEqual } from "node:crypto";
import {
  createAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
} from "./dtos/appointment.dto.ts";
import { AppointmentsRepository } from "./database/appointments.repository.ts";
import { AppointmentsService } from "./domain/appointments.service.ts";
import { z } from "zod";

const publicEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((email) => email.toLowerCase()),
});
const publicAppointmentLookupSchema = publicEmailSchema.extend({
  management_token: z
    .string()
    .trim()
    .transform((token) => token.toUpperCase())
    .refine(
      (token) =>
        token.length === 6
          ? /^[A-HJ-NP-Z2-9]{6}$/.test(token)
          : z.string().uuid().safeParse(token).success,
      "Código de gerenciamento inválido.",
    ),
});

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

  const requireBarbershopId = (request: FastifyRequest) => {
    if (request.user?.barbershop_id) return request.user.barbershop_id;
    throw Object.assign(new Error("Não autorizado."), { statusCode: 401 });
  };

  const requirePublicBarbershopId = (request: FastifyRequest) => {
    const id = request.headers["x-barbershop-id"];
    if (!id || typeof id !== "string") {
      throw Object.assign(
        new Error("Identificação da barbearia é obrigatória."),
        { statusCode: 401 },
      );
    }

    return z.string().uuid().parse(id);
  };

  app.get("/api/v1/appointments/public", async (request, reply) => {
    const { email, management_token: managementToken } =
      publicAppointmentLookupSchema.parse(request.query);
    const barbershopId = requirePublicBarbershopId(request);
    const appointments = await repository.findByManagementToken(
      barbershopId,
      email,
      managementToken,
    );
    if (!appointments.length) {
      throw Object.assign(new Error("Agendamento não encontrado."), {
        statusCode: 404,
      });
    }
    return reply.status(200).send(appointments);
  });

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

    const startTime = new Date(data.startTime);
    let professionalId = data.professionalId;
    if (professionalId === "any") {
      const professional = await repository.findAvailableProfessional(
        barbershopId,
        startTime,
        serviceData.duration_min,
      );
      if (!professional) {
        throw Object.assign(
          new Error("Nenhum profissional disponível neste horário."),
          { statusCode: 409 },
        );
      }
      professionalId = professional.id;
    } else {
      const isProfessionalActive = await repository.isProfessionalActive(
        barbershopId,
        professionalId,
      );
      if (!isProfessionalActive) {
        throw Object.assign(
          new Error("Este profissional não está aceitando novos agendamentos."),
          { statusCode: 400 },
        );
      }

      const isAvailable = await repository.checkAvailability(
        barbershopId,
        startTime,
        professionalId,
        serviceData.duration_min,
      );
      if (!isAvailable) {
        throw Object.assign(
          new Error(
            "O profissional não atende neste dia ou horário. Escolha outro horário disponível.",
          ),
          { statusCode: 422 },
        );
      }
    }

    const appointment = await repository.create(
      barbershopId,
      { ...data, professionalId },
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

  app.patch("/api/v1/appointments/:id", async (request, reply) => {
    const barbershopId = requireBarbershopId(request);
    const { id } = request.params as { id: string };
    const data = rescheduleAppointmentSchema.parse(request.body);

    const appointment = await repository.findById(barbershopId, id);
    if (!appointment) {
      throw Object.assign(new Error("Agendamento não encontrado."), {
        statusCode: 404,
      });
    }

    if (appointment.status !== "confirmed") {
      throw Object.assign(
        new Error("Apenas agendamentos confirmados podem ser reagendados."),
        { statusCode: 422 },
      );
    }

    const updatedAppointment = await repository.reschedule(
      barbershopId,
      id,
      data,
    );
    if (!updatedAppointment) {
      throw Object.assign(
        new Error("O agendamento não está mais disponível para reagendamento."),
        { statusCode: 422 },
      );
    }

    return reply.status(200).send(updatedAppointment);
  });

  // PATCH /api/v1/appointments/:id/cancel (Protegido)
  app.patch("/api/v1/appointments/:id/cancel", async (request, reply) => {
    const adminUser = request.user as
      | { sub?: string; barbershop_id?: string; role?: string }
      | undefined;
    const isAdmin = Boolean(
      adminUser?.sub &&
        adminUser.barbershop_id &&
        (adminUser.role === "admin" || adminUser.role === "super_admin"),
    );
    const barbershopId = isAdmin
      ? requireBarbershopId(request)
      : requirePublicBarbershopId(request);
    const { id } = request.params as { id: string };
    const { managementToken } = cancelAppointmentSchema.parse(
      request.body || {},
    );

    const appointment = await repository.findById(barbershopId, id);
    if (!appointment)
      throw Object.assign(new Error("Agendamento não encontrado."), {
        statusCode: 404,
      });
    if (appointment.status !== "confirmed")
      throw Object.assign(
        new Error("Apenas agendamentos confirmados podem ser cancelados."),
        { statusCode: 422 },
      );

    if (!isAdmin) {
      if (!managementToken) {
        throw Object.assign(
          new Error("O código de gerenciamento é obrigatório."),
          { statusCode: 401 },
        );
      }

      const expectedToken = Buffer.from(appointment.management_token);
      const suppliedToken = Buffer.from(managementToken.toUpperCase());
      if (
        expectedToken.length !== suppliedToken.length ||
        !timingSafeEqual(expectedToken, suppliedToken)
      ) {
        throw Object.assign(new Error("Agendamento não encontrado."), {
          statusCode: 404,
        });
      }
      service.validateCancellation(new Date(appointment.start_time));
    }

    const cancelled = await repository.cancel(id);
    return reply.status(200).send(cancelled);
  });
}
