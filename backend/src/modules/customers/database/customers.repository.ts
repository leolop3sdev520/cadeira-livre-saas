import { sql } from "../../../shared/db/index.ts";

export type CustomerSummary = {
  customer_name: string;
  customer_email: string;
  total_appointments: number;
  total_spent_cents: number;
  average_ticket_cents: number;
  last_visit_date: string;
};

export class CustomersRepository {
  async findAllByBarbershop(
    barbershopId: string,
  ): Promise<CustomerSummary[]> {
    return sql<CustomerSummary[]>`
      WITH eligible_appointments AS (
        SELECT
          customer_name,
          customer_email,
          LOWER(customer_email) AS normalized_email,
          start_time,
          price_cents,
          status
        FROM appointments
        WHERE barbershop_id = ${barbershopId}
          AND status <> 'cancelled'
      ),
      customer_totals AS (
        SELECT
          normalized_email,
          COUNT(*)::int AS total_appointments,
          COALESCE(
            SUM(price_cents) FILTER (
              WHERE status IN ('confirmed', 'completed')
            ),
            0
          )::float8 AS total_spent_cents,
          MAX(start_time) AS last_visit_date
        FROM eligible_appointments
        GROUP BY normalized_email
      ),
      latest_appointments AS (
        SELECT DISTINCT ON (normalized_email)
          normalized_email,
          customer_name,
          customer_email
        FROM eligible_appointments
        ORDER BY normalized_email, start_time DESC
      )
      SELECT
        latest.customer_name,
        latest.customer_email,
        totals.total_appointments,
        totals.total_spent_cents,
        (
          totals.total_spent_cents / NULLIF(totals.total_appointments, 0)
        )::float8 AS average_ticket_cents,
        totals.last_visit_date
      FROM customer_totals totals
      JOIN latest_appointments latest USING (normalized_email)
      ORDER BY totals.total_spent_cents DESC, latest.customer_name ASC
    `;
  }
}
