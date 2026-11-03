import { env } from "../../../config/env.ts";
import { sql } from "../../../shared/db/index.ts";

export type DashboardMetrics = {
  appointments_today: number;
  revenue_today: number;
  clients_count: number;
  no_show_rate: number;
};

export type DashboardChartPoint = {
  month: string;
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
      WITH current_month AS (
        SELECT date_trunc(
          'month',
          CURRENT_TIMESTAMP AT TIME ZONE ${env.BUSINESS_TIMEZONE}
        )::date AS local_month
      ),
      local_months AS (
        SELECT generate_series(
          current_month.local_month - interval '11 months',
          current_month.local_month,
          interval '1 month'
        )::date AS local_month
        FROM current_month
      ),
      monthly_appointments AS (
        SELECT
          date_trunc(
            'month',
            a.start_time AT TIME ZONE ${env.BUSINESS_TIMEZONE}
          )::date AS local_month,
          COUNT(*)::int AS appointments,
          COALESCE(SUM(a.price_cents), 0)::float8 AS revenue
        FROM appointments a
        CROSS JOIN current_month
        WHERE a.barbershop_id = ${barbershopId}
          AND a.status = 'confirmed'
          AND (a.start_time AT TIME ZONE ${env.BUSINESS_TIMEZONE})
            >= current_month.local_month - interval '11 months'
          AND (a.start_time AT TIME ZONE ${env.BUSINESS_TIMEZONE})
            < current_month.local_month + interval '1 month'
        GROUP BY 1
      )
      SELECT
        (ARRAY[
          'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ])[EXTRACT(MONTH FROM local_months.local_month)::int] AS month,
        COALESCE(monthly_appointments.appointments, 0)::int AS appointments,
        COALESCE(monthly_appointments.revenue, 0)::float8 AS revenue
      FROM local_months
      LEFT JOIN monthly_appointments
        ON monthly_appointments.local_month = local_months.local_month
      ORDER BY local_months.local_month
    `;
  }
}
