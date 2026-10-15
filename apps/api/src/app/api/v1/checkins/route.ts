import { z } from "zod";
import { HttpResult, protectedRoute } from "@/shared/http";
import { gamificationService } from "@/modules/gamification/gamification.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Alias kontrak OpenAPI (/checkins). 201 saat check-in baru, 200 saat pengulangan (idempotent, bukan 409).
export const POST = protectedRoute({ roles: ["SANTRI"], rateLimit: [{ name: "checkin", limit: 20, windowMs: 60_000, by: "user" }] }, async ({ user }) => {
  const r = await gamificationService.checkIn(user);
  return new HttpResult(r.alreadyCheckedIn ? 200 : 201, r);
});
export const GET = protectedRoute({ roles: ["SANTRI"], query: z.object({}) }, ({ user }) => gamificationService.checkinHistory(user.id));
