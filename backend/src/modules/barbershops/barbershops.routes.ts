import type { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sql } from "../../shared/db/index.ts";
import { uploadImageBuffer } from "../../shared/services/cloudinary.ts";

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug de barbearia inválido.");

export async function barbershopsRoutes(app: FastifyInstance) {
  const registrationSchema = z.object({
    name: z.string().trim().min(2).max(120),
    slug: z
      .string()
      .trim()
      .min(3)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug de barbearia inválido."),
    admin_email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((email) => email.toLowerCase()),
    admin_password: z.string().min(8).max(128),
    plan: z.enum(["solo", "equipe"]),
  });

  const profileSchema = z.object({
    name: z.string().trim().min(2).max(120),
    address: z.string().trim().max(300).nullable(),
    phone: z.string().trim().max(40).nullable(),
  });

  const getAuthenticatedBarbershopId = (request: {
    user?: { barbershop_id?: string };
  }) => {
    const barbershopId = request.user?.barbershop_id;
    if (!barbershopId) {
      throw Object.assign(new Error("Não autorizado."), { statusCode: 401 });
    }
    return barbershopId;
  };

  app.post("/api/v1/barbershops/register", async (request, reply) => {
    const data = registrationSchema.parse(request.body);
    const passwordHash = await bcrypt.hash(data.admin_password, 12);

    try {
      const { barbershop, user } = await sql.begin(async (transaction) => {
        const [createdBarbershop] = await transaction<{
          id: string;
          name: string;
          slug: string;
          plan: "solo" | "equipe";
        }[]>`
          INSERT INTO barbershops (name, slug, plan)
          VALUES (${data.name}, ${data.slug}, ${data.plan})
          RETURNING id, name, slug, plan
        `;

        if (!createdBarbershop) {
          throw new Error("Não foi possível criar a barbearia.");
        }

        const [createdUser] = await transaction<{ id: string; name: string }[]>`
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
          RETURNING id, name
        `;

        if (!createdUser) {
          throw new Error("Não foi possível criar o usuário administrador.");
        }

        return { barbershop: createdBarbershop, user: createdUser };
      });

      const token = app.jwt.sign(
        {
          sub: user.id,
          barbershop_id: barbershop.id,
          role: "admin",
        },
        { expiresIn: "1d" },
      );

      reply.setCookie("token", token, {
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
      });

      return reply.status(201).send({
        barbershop,
        user: { name: user.name, role: "admin" },
        token,
      });
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "code" in error) {
        const databaseError = error as {
          code?: string;
          constraint?: string;
        };
        if (
          databaseError.code === "23505" &&
          databaseError.constraint === "barbershops_slug_key"
        ) {
          throw Object.assign(
            new Error("Esta URL já está em uso. Escolha outra."),
            { statusCode: 409 },
          );
        }
        if (
          databaseError.code === "23505" &&
          databaseError.constraint === "users_email_key"
        ) {
          throw Object.assign(
            new Error("Este e-mail já está cadastrado. Faça login."),
            { statusCode: 409 },
          );
        }
      }
      throw error;
    }
  });

  app.get("/api/v1/barbershops/me", async (request, reply) => {
    const barbershopId = getAuthenticatedBarbershopId(request);
    const [barbershop] = await sql<
      {
        id: string;
        name: string;
        address: string | null;
        phone: string | null;
        logo_url: string | null;
      }[]
    >`
      SELECT id, name, address, phone, logo_url
      FROM barbershops
      WHERE id = ${barbershopId}
      LIMIT 1
    `;

    if (!barbershop) {
      throw Object.assign(new Error("Barbearia não encontrada."), {
        statusCode: 404,
      });
    }
    return reply.status(200).send(barbershop);
  });

  app.patch("/api/v1/barbershops/profile", async (request, reply) => {
    const barbershopId = getAuthenticatedBarbershopId(request);
    const profile = profileSchema.parse(request.body);
    const [barbershop] = await sql`
      UPDATE barbershops
      SET
        name = ${profile.name},
        address = ${profile.address},
        phone = ${profile.phone},
        updated_at = now()
      WHERE id = ${barbershopId}
      RETURNING id, name, address, phone, logo_url
    `;

    if (!barbershop) {
      throw Object.assign(new Error("Barbearia não encontrada."), {
        statusCode: 404,
      });
    }
    return reply.status(200).send(barbershop);
  });

  app.post("/api/v1/barbershops/logo", async (request, reply) => {
    const barbershopId = getAuthenticatedBarbershopId(request);
    const image = await request.file();
    if (!image) {
      throw Object.assign(new Error("Selecione uma imagem para enviar."), {
        statusCode: 400,
      });
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(image.mimetype)) {
      image.file.resume();
      throw Object.assign(
        new Error("Formato de imagem inválido. Use JPG, PNG ou WEBP."),
        { statusCode: 415 },
      );
    }

    const buffer = await image.toBuffer();
    if (image.file.truncated) {
      throw Object.assign(
        new Error("A imagem excede o limite de 5 MB."),
        { statusCode: 413 },
      );
    }

    const logoUrl = await uploadImageBuffer(buffer, "cadeira_livre/logos");
    const [barbershop] = await sql<{ logo_url: string | null }[]>`
      UPDATE barbershops
      SET logo_url = ${logoUrl}, updated_at = now()
      WHERE id = ${barbershopId}
      RETURNING logo_url
    `;

    if (!barbershop) {
      throw Object.assign(new Error("Barbearia não encontrada."), {
        statusCode: 404,
      });
    }
    return reply.status(200).send({ logo_url: barbershop.logo_url });
  });

  app.get("/api/v1/barbershops/:slug", async (request, reply) => {
    const { slug: rawSlug } = request.params as { slug: string };
    const slug = slugSchema.parse(rawSlug);
    const [barbershop] = await sql<
      {
        id: string;
        name: string;
        slug: string;
        address: string | null;
        logo_url: string | null;
        is_active: boolean;
      }[]
    >`
      SELECT id, name, slug, address, logo_url, is_active
      FROM barbershops
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (!barbershop) {
      throw Object.assign(new Error("Barbearia não encontrada."), {
        statusCode: 404,
      });
    }

    if (!barbershop.is_active) {
      throw Object.assign(
        new Error("Esta barbearia está temporariamente indisponível."),
        { statusCode: 404 },
      );
    }

    return reply.status(200).send(barbershop);
  });
}
