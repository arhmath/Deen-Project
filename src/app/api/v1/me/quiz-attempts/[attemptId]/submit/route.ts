import { protectedRoute } from "@/shared/http";
import { legacySubmitQuizAttempt, normalizeLegacyQuizAnswers } from "@/modules/progress/compat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = protectedRoute({ roles: ["SANTRI"] }, async ({ user, params, req }) => {
  const body = (await req.json()) as Record<string, unknown>;
  const answers = normalizeLegacyQuizAnswers(body);
  return legacySubmitQuizAttempt(user, params.attemptId!, answers);
});
