import fastify from "fastify";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import { env } from "../config/env.ts";
import { errorHandlerPlugin } from "./plugins/error-handler.ts";
import { corsPlugin } from "./plugins/cors.ts";
import { swaggerPlugin } from "./plugins/swagger.ts";
import { authPluginGlobal } from "./plugins/auth.ts";
import { authRoutes } from "../modules/auth/auth.routes.ts";
import { servicesRoutes } from "../modules/services/services.routes.ts";
import { professionalsRoutes } from "../modules/professionals/professionals.routes.ts";
import { availabilityRoutes } from "../modules/availability/availability.routes.ts";
import { appointmentsRoutes } from "../modules/appointments/appointments.routes.ts";
import { dashboardRoutes } from "../modules/dashboard/dashboard.routes.ts";
import { customersRoutes } from "../modules/customers/customers.routes.ts";
import { superAdminRoutes } from "../modules/super-admin/super-admin.routes.ts";
import { barbershopsRoutes } from "../modules/barbershops/barbershops.routes.ts";
import { sql } from "../shared/db/index.ts";

const isProduction = env.NODE_ENV === "production";

// Configuração do logger: JSON puro em produção, pino-pretty em desenvolvimento
const loggerConfig = isProduction
  ? { level: "info" }
  : {
      transport: {
        target: "pino-pretty",
        options: { translateTime: "HH:MM:ss Z", ignore: "pid,hostname" },
      },
    };

const app = fastify({ logger: loggerConfig });

// 1. CORS deve ser o primeiro para lidar com requisições OPTIONS
app.register(corsPlugin);

// 2. Plugins essenciais
app.register(cookie);
app.register(jwt, { secret: env.JWT_SECRET });
app.register(multipart, {
  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024,
  },
});
app.register(errorHandlerPlugin);
app.register(swaggerPlugin);

// 3. Middleware Global
app.register(authPluginGlobal);

// 4. Health Check
app.get("/health", async () => {
  await sql`SELECT 1`;
  return { status: "ok", timestamp: new Date().toISOString() };
});

// 5. Rotas
app.register(barbershopsRoutes);
app.register(authRoutes);
app.register(servicesRoutes);
app.register(professionalsRoutes);
app.register(availabilityRoutes);
app.register(appointmentsRoutes);
app.register(dashboardRoutes);
app.register(customersRoutes);
app.register(superAdminRoutes);

const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`🚀 Cadeira Livre API rodando em http://localhost:${env.PORT}`);
    console.log(`📚 Documentação Swagger em http://localhost:${env.PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
