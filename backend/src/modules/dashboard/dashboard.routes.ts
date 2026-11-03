import type { FastifyInstance } from "fastify";
import {
  DashboardRepository,
  type DashboardChartPoint,
} from "./database/dashboard.repository.ts";

export async function dashboardRoutes(app: FastifyInstance) {
  const repository = new DashboardRepository();

  app.get("/api/v1/dashboard/metrics", async (request, reply) => {
    const barbershopId = request.user?.barbershop_id;
    if (!barbershopId) {
      throw Object.assign(new Error("Não autorizado."), { statusCode: 401 });
    }

    const metrics = await repository.findMetrics(barbershopId);
    return reply.status(200).send(metrics);
  });

  app.get("/api/v1/dashboard/chart-data", async (request, reply) => {
    const barbershopId = request.user?.barbershop_id;
    if (!barbershopId) {
      throw Object.assign(new Error("Não autorizado."), { statusCode: 401 });
    }

    const chartData: DashboardChartPoint[] =
      await repository.findChartData(barbershopId);
    return reply.status(200).send(chartData);
  });
}
