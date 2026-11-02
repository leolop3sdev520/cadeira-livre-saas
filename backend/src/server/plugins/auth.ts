import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

// A função 'fp' faz o Fastify quebrar o encapsulamento e aplicar as regras globalmente
async function authPlugin(app: FastifyInstance) {
  app.addHook(
    "onRequest",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const publicRoutes = ["/health", "/api/v1/sessions", "/docs"];
      const isPublic = publicRoutes.some((route) =>
        request.url.startsWith(route),
      );

      const isClientGet =
        request.method === "GET" &&
        (request.url.startsWith("/api/v1/services") ||
          request.url.startsWith("/api/v1/professionals") ||
          request.url.startsWith("/api/v1/availability"));
      const isClientPostAppointment =
        request.method === "POST" &&
        request.url.startsWith("/api/v1/appointments");

      const isPublicRoute = isPublic || isClientGet || isClientPostAppointment;

      // Verifica o token se ele existir
      try {
        if (request.cookies.token || request.headers.authorization) {
          await request.jwtVerify();
        } else if (!isPublicRoute) {
          throw new Error("Token não fornecido");
        }
      } catch (err) {
        if (!isPublicRoute) {
          return reply.status(401).send({
            statusCode: 401,
            message: "Não autorizado. Faça login novamente.",
          });
        }
      }
    },
  );
}

export const authPluginGlobal = fp(authPlugin);
