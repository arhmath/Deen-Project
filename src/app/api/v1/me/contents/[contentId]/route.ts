import { protectedRoute } from "@/shared/http";
import { legacyContentDetail } from "@/modules/progress/compat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = protectedRoute({ roles: ["SANTRI", "ADMIN"] }, ({ user, params }) => legacyContentDetail(user, params.contentId!));
