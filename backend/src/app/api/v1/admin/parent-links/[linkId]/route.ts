import { protectedRoute } from "@/shared/http";
import { linkDecisionSchema, parentService } from "@/modules/parent/parent.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const PATCH = protectedRoute({ roles: ["ADMIN", "SUPERADMIN"], body: linkDecisionSchema }, ({ user, params, body }) =>
  parentService.decide(user, params.linkId!, body.status)
);
