import { z } from "zod";

/**
 * Validate process.env once at module load. Fail fast in production if a
 * critical secret is missing. In development, log warnings and let dev tooling
 * (next dev with no JWT yet, etc.) keep working.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().url(),
  SHADOW_DATABASE_URL: z.string().url().optional(),

  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().int().positive().default(7),

  APP_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  UPLOAD_DIR: z.string().default("/app/uploads"),

  CRON_LOCK_TTL_MS: z.coerce.number().int().positive().optional(),
  REMINDER_CHECK_CRON: z.string().optional(),
  REMINDER_NOTIFY_HOURS_BEFORE: z.coerce.number().int().positive().optional(),

  INSTANCE_ID: z.string().optional(),
  WEBHOOK_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  ENABLE_API_DOCS: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (result.success) return result.data;

  const issues = result.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");

  if (process.env.NODE_ENV === "production") {
    console.error("[env] Configuración inválida:\n" + issues);
    throw new Error("Variables de entorno inválidas — abortando arranque.");
  }
  console.warn("[env] Advertencia (dev) — variables incompletas:\n" + issues);
  // In dev, fall back to whatever exists; cast unsafely so the app boots.
  return process.env as unknown as Env;
}

export const env = parseEnv();
