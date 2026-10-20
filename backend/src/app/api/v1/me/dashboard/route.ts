import { protectedRoute } from "@/shared/http";
import { dashboardService } from "@/modules/dashboard/dashboard.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ roles: ["SANTRI"] }, ({ user }) => dashboardService.santri(user));
