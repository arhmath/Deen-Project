import { protectedRoute } from "@/shared/http";
import { gamificationService, historyQuery } from "@/modules/gamification/gamification.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ roles: ["SANTRI"], query: historyQuery }, ({ user, query }) => gamificationService.history(user.id, query));
