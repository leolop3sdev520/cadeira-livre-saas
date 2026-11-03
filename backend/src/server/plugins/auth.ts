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
          request.url.startsWith("/api/v1/barbershops") ||
          request.url.startsWith("/api/v1/availability"));
      const isClientAppointmentsGet =
        request.method === "GET" &&
        /^\/api\/v1\/appointments\/public(?:\?|$)/.test(request.url);
      const isClientPostAppointment =
        request.method === "POST" &&
        request.url.startsWith("/api/v1/appointments");
      const isClientCancelAppointment =
        request.method === "PATCH" &&
        /^\/api\/v1\/appointments\/[^/]+\/cancel(?:\?|$)/.test(request.url);

      const isPublicRoute =
        isPublic ||
        (request.method === "POST" &&
          request.url.split("?")[0] === "/api/v1/barbershops/register") ||
        isClientGet ||
        isClientAppointmentsGet ||
        isClientPostAppointment ||
        isClientCancelAppointment;
      const isSuperAdminRoute = /^\/api\/v1\/super-admin(?:\/|$)/.test(
        request.url,
      );

      // Verifica o token se ele existir
      try {
        if (request.cookies.token || request.headers.authorization) {
          await request.jwtVerify();
          if (isSuperAdminRoute && request.user?.role !== "super_admin") {
            return reply.status(403).send({
              statusCode: 403,
              error: "Forbidden",
              message: "Acesso restrito ao Super Admin.",
            });
          }
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
