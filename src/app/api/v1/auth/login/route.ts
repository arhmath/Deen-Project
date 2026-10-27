import { publicRoute } from "@/shared/http";
import { loginSchema } from "@/modules/auth/auth.schema";
import { authService } from "@/modules/auth/auth.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = publicRoute(
  { body: loginSchema, rateLimit: [{ name: "login", limit: 20, windowMs: 60_000 }] },
  ({ body }) => authService.login(body)
);
