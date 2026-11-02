import type { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sql } from "../../shared/db/index.ts";

export async function authRoutes(app: FastifyInstance) {
  // ─── ROTA DE LOGIN ─────────────────────────────────────
  app.post("/api/v1/sessions", async (request, reply) => {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string(),
    });

    const { email, password } = loginSchema.parse(request.body);

    const [user] = await sql<
      {
        id: string;
        name: string;
        password_hash: string;
        barbershop_id: string;
        role: string;
      }[]
    >`
      SELECT id, name, password_hash, barbershop_id, role 
      FROM users 
      WHERE email = ${email}
    `;

    if (!user) {
      throw Object.assign(new Error("E-mail ou senha incorretos."), {
        statusCode: 401,
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      throw Object.assign(new Error("E-mail ou senha incorretos."), {
        statusCode: 401,
      });
    }

    const token = app.jwt.sign(
      { sub: user.id, barbershop_id: user.barbershop_id, role: user.role },
      { expiresIn: "1d" },
    );

    reply.setCookie("token", token, {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    });

    return reply.status(200).send({
      user: { name: user.name, role: user.role },
      token: token,
    });
  });

  // ─── ROTA DE LOGOUT ────────────────────────────────────
  app.post("/api/v1/sessions/logout", async (request, reply) => {
    // Limpa o cookie no navegador do usuário
    reply.clearCookie("token", { path: "/" });
    return reply.status(200).send({ message: "Logout realizado com sucesso." });
  });
}
