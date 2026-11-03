import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sql } from "../../shared/db/index.ts";

const createBarbershopSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido."),
  admin_email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  admin_password: z.string().min(8).max(128),
});

type SuperAdminBarbershop = {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
  total_professionals: number;
  total_appointments: number;
  total_revenue: number;
};

function requireSuperAdmin(role: string | undefined) {
  if (role !== "super_admin") {
    throw Object.assign(new Error("Acesso restrito ao Super Admin."), {
      statusCode: 403,
    });
  }
}

export async function superAdminRoutes(app: FastifyInstance) {
  app.get("/api/v1/super-admin/metrics", async (request, reply) => {
    requireSuperAdmin(request.user?.role);

    const [metrics] = await sql<
      {
        total_barbershops: number;
        total_appointments: number;
        total_revenue_cents: number;
      }[]
    >`
      SELECT
        (SELECT COUNT(*)::int FROM barbershops) AS total_barbershops,
        (SELECT COUNT(*)::int FROM appointments) AS total_appointments,
        (
          SELECT COALESCE(SUM(price_cents), 0)::float8
          FROM appointments
          WHERE status IN ('confirmed', 'completed')
        ) AS total_revenue_cents
    `;

    return reply.status(200).send(metrics);
  });

  app.post("/api/v1/super-admin/barbershops", async (request, reply) => {
    requireSuperAdmin(request.user?.role);
    const data = createBarbershopSchema.parse(request.body);
    const passwordHash = await bcrypt.hash(data.admin_password, 12);

    try {
      const barbershop = await sql.begin(async (transaction) => {
        const [createdBarbershop] = await transaction<{ id: string }[]>`
          INSERT INTO barbershops (name, slug)
          VALUES (${data.name}, ${data.slug})
          RETURNING id
        `;
        if (!createdBarbershop) {
          throw new Error("Não foi possível criar a barbearia.");
        }

        await transaction`
          INSERT INTO users (
            barbershop_id,
            name,
            email,
            password_hash,
            role
          )
          VALUES (
            ${createdBarbershop.id},
            ${data.name},
            ${data.admin_email},
            ${passwordHash},
            'admin'
          )
        `;

        return createdBarbershop;
      });

      return reply.status(201).send({
        id: barbershop.id,
        name: data.name,
        slug: data.slug,
      });
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        throw Object.assign(
          new Error("O slug ou o e-mail do administrador já está cadastrado."),
          { statusCode: 409 },
        );
      }
      throw error;
    }
  });

  app.get("/api/v1/super-admin/barbershops", async (request, reply) => {
    requireSuperAdmin(request.user?.role);

    const barbershops = await sql<SuperAdminBarbershop[]>`
      SELECT
        b.id,
        b.name,
        b.slug,
        b.created_at,
        (
          SELECT COUNT(*)::int
          FROM professionals p
          WHERE p.barbershop_id = b.id
            AND p.is_active = true
        ) AS total_professionals,
        (
          SELECT COUNT(*)::int
          FROM appointments a
          WHERE a.barbershop_id = b.id
        ) AS total_appointments,
        (
          SELECT COALESCE(SUM(a.price_cents), 0)::float8
          FROM appointments a
          WHERE a.barbershop_id = b.id
            AND a.status IN ('confirmed', 'completed')
        ) AS total_revenue
      FROM barbershops b
      ORDER BY total_revenue DESC, b.name ASC
    `;

    return reply.status(200).send(barbershops);
  });
}
