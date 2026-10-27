import { created, publicRoute } from "@/shared/http";
import { registerSchema } from "@/modules/auth/auth.schema";
import { authService } from "@/modules/auth/auth.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = publicRoute(
  { body: registerSchema, rateLimit: [{ name: "register", limit: 10, windowMs: 3_600_000 }] },
  async ({ body }) => created(await authService.register(body))
);
