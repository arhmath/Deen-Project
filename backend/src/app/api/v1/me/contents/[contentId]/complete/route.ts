import { protectedRoute } from "@/shared/http";
import { legacyCompleteContent } from "@/modules/progress/compat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = protectedRoute({ roles: ["SANTRI"] }, ({ user, params }) => legacyCompleteContent(user, params.contentId!));
