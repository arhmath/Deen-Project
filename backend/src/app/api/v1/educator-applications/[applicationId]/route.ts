import { protectedRoute } from "@/shared/http";
import { educatorDecisionSchema } from "@/modules/educator-applications/educator-application.schema";
import { educatorApplicationService } from "@/modules/educator-applications/educator-application.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const PATCH = protectedRoute(
  { roles: ["SUPERADMIN"], body: educatorDecisionSchema },
  ({ user, params, body }) => educatorApplicationService.decide(user, params.applicationId!, body.decision, body.note)
);
