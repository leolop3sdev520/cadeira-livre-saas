import fp from "fastify-plugin";
import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";

async function corsHandler(app: FastifyInstance) {
  await app.register(cors, {
    origin: true, // Aceita qualquer origem (localhost:3000)
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-barbershop-id",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],
  });
}

export const corsPlugin = fp(corsHandler);
