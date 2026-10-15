import { protectedRoute } from "@/shared/http";
import { submitSchema } from "@/modules/progress/learning.schema";
import { submitContent } from "@/modules/progress/learning.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Skor, XP, dan penyelesaian dihitung server. Idempotency-Key (header atau body) mencegah reward ganda saat retry.
export const POST = protectedRoute(
  { roles: ["SANTRI"], body: submitSchema, rateLimit: [{ name: "submit", limit: 30, windowMs: 60_000, by: "user" }] },
  ({ user, params, body, req }) => submitContent(user, params.contentId!, body, req.headers.get("idempotency-key"))
);
