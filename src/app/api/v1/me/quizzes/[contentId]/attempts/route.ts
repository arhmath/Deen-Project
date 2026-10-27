import { protectedRoute } from "@/shared/http";
import { legacyStartQuizAttempt } from "@/modules/progress/compat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = protectedRoute({ roles: ["SANTRI"] }, ({ user, params }) => legacyStartQuizAttempt(user, params.contentId!));
