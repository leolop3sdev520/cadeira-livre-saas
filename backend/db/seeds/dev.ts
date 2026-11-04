import { sql } from "../../src/shared/db/index.ts";
import bcrypt from "bcryptjs"; // <-- ADICIONE ESTA LINHA

async function seed(): Promise<void> {
  console.log("🌱 Inserindo dados de desenvolvimento...");

  // ─── Barbearia (Tenant) ────────────────────────────────
  const [barbershop] = await sql<{ id: string }[]>`
    INSERT INTO barbershops (name, slug)
    VALUES ('Barbearia do Léo', 'barbearia-do-leo')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `;
  console.log("✓ Barbearia:", barbershop?.id);

  // ─── Usuário Admin (NOVO) ──────────────────────────────
  const passwordHash = await bcrypt.hash("senha123", 10);
  await sql`
    INSERT INTO users (barbershop_id, name, email, password_hash, role)
    VALUES (${barbershop!.id}, 'Zé Barbeiro', 'ze@barbearia.com', ${passwordHash}, 'admin')
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
  `;
  console.log("✓ Usuário Admin (ze@barbearia.com / senha123)");

  const superAdminPasswordHash = await bcrypt.hash("admin123", 10);
  await sql`
    INSERT INTO users (barbershop_id, name, email, password_hash, role)
    VALUES (
      ${barbershop!.id},
      'Super Admin',
      'admin@cadeiralivre.com',
      ${superAdminPasswordHash},
      'super_admin'
    )
    ON CONFLICT (email) DO UPDATE SET
      barbershop_id = EXCLUDED.barbershop_id,
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role
  `;
  console.log("✓ Super Admin (admin@cadeiralivre.com / admin123)");

  // ─── Profissionais ─────────────────────────────────────
  const professionals = await sql<{ id: string; name: string }[]>`
    INSERT INTO professionals (barbershop_id, name, email, phone)
    SELECT ${barbershop!.id}, v.name, v.email, v.phone
    FROM (VALUES
      ('Rafael Almeida', 'rafael@cadeiralivre.dev', '+55 11 99999-0001'),
      ('Marina Costa', 'marina@cadeiralivre.dev', '+55 11 99999-0002')
    ) AS v(name, email, phone)
    WHERE NOT EXISTS (
      SELECT 1
      FROM professionals p
      WHERE p.barbershop_id = ${barbershop!.id}
        AND p.email = v.email
    )
    RETURNING id, name
  `;
  console.log("✓ Profissionais:", professionals.map((p) => p.name).join(", "));

  // ─── Serviços ──────────────────────────────────────────
  await sql`
    INSERT INTO services (barbershop_id, name, duration_min, price_cents)
    SELECT * FROM (VALUES
      (${barbershop!.id}::uuid, 'Corte Masculino', 30, 5000),
      (${barbershop!.id}::uuid, 'Barba Terapia',   20, 3500),
      (${barbershop!.id}::uuid, 'Corte + Barba',   50, 8000),
      (${barbershop!.id}::uuid, 'Coloração',       90, 15000)
    ) AS v(barbershop_id, name, duration_min, price_cents)
    WHERE NOT EXISTS (
      SELECT 1 FROM services WHERE name = v.name AND barbershop_id = v.barbershop_id
    )
  `;
  console.log("✓ Serviços inseridos");

  // ─── Jornada semanal ───────────────────────────────────
  const rafael = professionals.find((p) => p.name === "Rafael Almeida")!;
  await sql`
    INSERT INTO working_hours (professional_id, weekday, start_time, end_time)
    SELECT ${rafael.id}, wd, '09:00'::time, '18:00'::time
    FROM generate_series(1, 5) AS wd
    ON CONFLICT (professional_id, weekday, start_time) DO NOTHING
  `;

  const marina = professionals.find((p) => p.name === "Marina Costa")!;
  await sql`
    INSERT INTO working_hours (professional_id, weekday, start_time, end_time)
    SELECT ${marina.id}, wd, '10:00'::time, '19:00'::time
    FROM generate_series(1, 6) AS wd
    ON CONFLICT (professional_id, weekday, start_time) DO NOTHING
  `;
  console.log("✓ Jornadas de trabalho inseridas");

  console.log("✅ Seed concluído.");
  await sql.end();
}

seed().catch((err) => {
  console.error("❌ Erro no seed:", err);
  process.exit(1);
});
