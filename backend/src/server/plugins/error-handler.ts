import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  FastifyError,
} from "fastify";
import { ZodError } from "zod";

export async function errorHandlerPlugin(app: FastifyInstance) {
  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    reply.status(404).send({
      statusCode: 404,
      error: "Not Found",
      message: `Rota ${request.method} ${request.url} não encontrada.`,
    });
  });

  app.setErrorHandler(
    (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
      // 1. Erro de validação do Zod (checa a instância, o nome ou a propriedade issues)
      if (
        error instanceof ZodError ||
        error.name === "ZodError" ||
        "issues" in error
      ) {
        const zodError = error as unknown as ZodError;
        return reply.status(422).send({
          statusCode: 422,
          error: "Unprocessable Entity",
          message: "Erro de validação nos dados enviados.",
          issues: zodError.format ? zodError.format() : error.message,
        });
      }

      // 2. Erro de colisão de horário no PostgreSQL (EXCLUDE CONSTRAINT)
      if (error.code === "23P01") {
        return reply.status(409).send({
          statusCode: 409,
          error: "Conflict",
          message:
            "Horário indisponível. Já existe um agendamento para este profissional neste período.",
        });
      }

      // 3. Erros explícitos lançados pela aplicação (ex: 404, 401)
      if (error.statusCode && typeof error.statusCode === "number") {
        return reply.status(error.statusCode).send({
          statusCode: error.statusCode,
          error: error.name || "Error",
          message: error.message,
        });
      }

      // 4. Erro interno não mapeado (500)
      app.log.error(error);
      return reply.status(500).send({
        statusCode: 500,
        error: "Internal Server Error",
        message: "Ocorreu um erro interno inesperado no servidor.",
      });
    },
  );
}
