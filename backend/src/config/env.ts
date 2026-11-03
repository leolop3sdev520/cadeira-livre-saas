import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().url(),
  BUSINESS_TIMEZONE: z.string().default("America/Sao_Paulo"),
  CANCELLATION_MIN_HOURS: z.coerce.number().int().min(0).default(2),
  CORS_ORIGIN: z.string().default("*"),
  JWT_SECRET: z
    .string()
    .min(10, "A chave JWT precisa ter pelo menos 10 caracteres."), // <-- NOVO
  CLOUDINARY_CLOUD_NAME: z.string().default(""),
  CLOUDINARY_API_KEY: z.string().default(""),
  CLOUDINARY_API_SECRET: z.string().default(""),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:");
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}
export const env = parsed.data;
