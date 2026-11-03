import { env } from "../../../config/env.ts";
import { sql } from "../../../shared/db/index.ts";

export type DashboardMetrics = {
  appointments_today: number;
  revenue_today: number;
  clients_count: number;
  no_show_rate: number;
};

export type DashboardChartPoint = {
  date: string;
  appointments: number;
  revenue: number;
};

export class DashboardRepository {
  async findMetrics(barbershopId: string): Promise<DashboardMetrics> {
    const [metrics] = await sql<DashboardMetrics[]>`
      WITH local_date AS (
        SELECT (CURRENT_TIMESTAMP AT TIME ZONE ${env.BUSINESS_TIMEZONE})::date
          AS today
      )
      SELECT
        COUNT(*) FILTER (
          WHERE a.status = 'confirmed'
            AND (a.start_time AT TIME ZONE ${env.BUSINESS_TIMEZONE})::date =
              local_date.today
        )::int AS appointments_today,
        COALESCE(
          SUM(a.price_cents) FILTER (
            WHERE a.status = 'confirmed'
              AND (a.start_time AT TIME ZONE ${env.BUSINESS_TIMEZONE})::date =
                local_date.today
          ),
          0
        )::float8 AS revenue_today,
        COUNT(DISTINCT LOWER(a.customer_email))::int AS clients_count,
        COALESCE(
          COUNT(*) FILTER (WHERE a.status = 'no_show')::float8 * 100 /
            NULLIF(
              COUNT(*) FILTER (
                WHERE a.status IN ('completed', 'no_show')
              ),
              0
            ),
          0
        )::float8 AS no_show_rate
      FROM appointments a
      CROSS JOIN local_date
      WHERE a.barbershop_id = ${barbershopId}
    `;

    if (!metrics) {
      throw new Error("Não foi possível carregar as métricas do dashboard.");
    }

    return metrics;
  }

  async findChartData(barbershopId: string): Promise<DashboardChartPoint[]> {
    return sql<DashboardChartPoint[]>`
      WITH local_days AS (
        SELECT generate_series(
          (CURRENT_TIMESTAMP AT TIME ZONE ${env.BUSINESS_TIMEZONE})::date
            - interval '6 days',
          (CURRENT_TIMESTAMP AT TIME ZONE ${env.BUSINESS_TIMEZONE})::date,
          interval '1 day'
        )::date AS local_day
      )
      SELECT
        TO_CHAR(local_days.local_day, 'DD/MM') AS date,
        COUNT(a.id)::int AS appointments,
        (COALESCE(SUM(a.price_cents), 0)::float8 / 100) AS revenue
      FROM local_days
      LEFT JOIN appointments a
        ON a.barbershop_id = ${barbershopId}
        AND a.status = 'confirmed'
        AND (a.start_time AT TIME ZONE ${env.BUSINESS_TIMEZONE})
          >= local_days.local_day::timestamp
        AND (a.start_time AT TIME ZONE ${env.BUSINESS_TIMEZONE})
          < (local_days.local_day + interval '1 day')::timestamp
      GROUP BY local_days.local_day
      ORDER BY local_days.local_day
    `;
  }
}
