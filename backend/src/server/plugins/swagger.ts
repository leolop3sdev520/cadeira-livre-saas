import type { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

export async function swaggerPlugin(app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Cadeira Livre API",
        description:
          "API de agendamentos com exclusão de sobreposição no banco.",
        version: "1.0.0",
      },
      servers: [
        { url: "http://localhost:3333", description: "Servidor Local" },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });
}
