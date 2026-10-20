import { protectedRoute } from "@/shared/http";
import { gamificationService } from "@/modules/gamification/gamification.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ roles: ["SANTRI"] }, ({ user }) => gamificationService.summary(user.id));
