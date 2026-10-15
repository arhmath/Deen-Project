import { publicRoute } from "@/shared/http";
import { refreshSchema } from "@/modules/auth/auth.schema";
import { authService } from "@/modules/auth/auth.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = publicRoute(
  { body: refreshSchema, rateLimit: [{ name: "refresh", limit: 30, windowMs: 60_000 }] },
  ({ body }) => authService.refresh(body.refreshToken)
);
