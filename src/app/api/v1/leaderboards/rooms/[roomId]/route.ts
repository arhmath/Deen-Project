import { z } from "zod";
import { protectedRoute } from "@/shared/http";
import { leaderboardService } from "@/modules/leaderboard/leaderboard.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const q = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(10) });
export const GET = protectedRoute({ roles: ["SANTRI"], query: q }, ({ user, params, query }) =>
  leaderboardService.page(user, { roomId: params.roomId!, page: query.page, pageSize: query.limit })
);
