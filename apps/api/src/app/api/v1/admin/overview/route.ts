import { protectedRoute } from "@/shared/http";
import { monitoringService } from "@/modules/monitoring/monitoring.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ roles: ["ADMIN"] }, ({ user }) => monitoringService.overview(user));
