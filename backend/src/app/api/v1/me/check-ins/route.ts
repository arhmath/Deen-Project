import { protectedRoute } from "@/shared/http";
import { gamificationService } from "@/modules/gamification/gamification.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Idempotent: pengulangan di tanggal yang sama → alreadyCheckedIn:true tanpa reward baru.
export const POST = protectedRoute({ roles: ["SANTRI"], rateLimit: [{ name: "checkin", limit: 20, windowMs: 60_000, by: "user" }] }, ({ user }) =>
  gamificationService.checkIn(user)
);
