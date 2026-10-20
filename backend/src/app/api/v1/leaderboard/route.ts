import { protectedRoute } from "@/shared/http";
import { leaderboardQuery, leaderboardService } from "@/modules/leaderboard/leaderboard.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ query: leaderboardQuery }, ({ user, query }) => leaderboardService.page(user, query));
