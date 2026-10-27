import { publicRoute } from "@/shared/http";
import { forgotPasswordSchema } from "@/modules/auth/auth.schema";
import { passwordResetService } from "@/modules/auth/password-reset.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = publicRoute(
  { body: forgotPasswordSchema, rateLimit: [{ name: "forgot-password", limit: 5, windowMs: 3_600_000 }] },
  ({ body }) => passwordResetService.request(body)
);
