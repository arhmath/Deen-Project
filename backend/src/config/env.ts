import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_TIMEZONE: z.string().default("Asia/Jakarta"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET minimal 32 karakter"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET minimal 32 karakter"),
  ACCESS_TOKEN_TTL_MIN: z.coerce.number().int().min(1).max(1440).default(60),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  BCRYPT_COST: z.coerce.number().int().min(8).max(15).default(12),

  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  AI_PROVIDER: z.enum(["anthropic", "openai", "local"]).default("local"),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(),
  AI_BASE_URL: z.string().optional(),
  AI_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30000),
  AI_RAG_TOP_K: z.coerce.number().int().min(1).max(20).default(5),
  AI_RAG_MIN_SCORE: z.coerce.number().min(0).max(1).default(0.7),
  AI_MAX_RECENT_MESSAGES: z.coerce.number().int().min(2).max(50).default(12),
  AI_MAX_SUMMARY_TOKENS: z.coerce.number().int().min(100).default(800),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Divalidasi sekali saat pertama dipakai (bukan saat import) agar `next build` tidak gagal tanpa .env. */
export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`Konfigurasi environment tidak valid → ${issues}`);
    }
    cached = parsed.data;
  }
  return cached;
}

/** Hanya untuk test. */
export function resetEnvCache() {
  cached = undefined;
}
