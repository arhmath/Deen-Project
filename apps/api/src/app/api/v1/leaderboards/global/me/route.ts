import { protectedRoute } from "@/shared/http";
import { leaderboardService } from "@/modules/leaderboard/leaderboard.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ roles: ["SANTRI"] }, async ({ user }) => (await leaderboardService.page(user, { page: 1, pageSize: 1 })).me);
