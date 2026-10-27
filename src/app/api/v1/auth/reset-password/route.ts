import { publicRoute } from "@/shared/http";
import { resetPasswordSchema } from "@/modules/auth/auth.schema";
import { passwordResetService } from "@/modules/auth/password-reset.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = publicRoute(
  { body: resetPasswordSchema, rateLimit: [{ name: "reset-password", limit: 10, windowMs: 15 * 60_000 }] },
  ({ body }) => passwordResetService.reset(body)
);
