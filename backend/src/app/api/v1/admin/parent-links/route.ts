import { protectedRoute } from "@/shared/http";
import { linkListQuery, parentService } from "@/modules/parent/parent.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ roles: ["ADMIN"], query: linkListQuery }, ({ user, query }) => parentService.listRequests(user, query.status));
