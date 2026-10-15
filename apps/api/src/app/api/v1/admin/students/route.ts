import { protectedRoute } from "@/shared/http";
import { monitoringService, studentsQuery } from "@/modules/monitoring/monitoring.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ roles: ["ADMIN"], query: studentsQuery }, ({ user, query }) => monitoringService.students(user, query));
