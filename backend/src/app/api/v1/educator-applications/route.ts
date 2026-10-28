import { created, protectedRoute, publicRoute } from "@/shared/http";
import { educatorApplicationSchema } from "@/modules/educator-applications/educator-application.schema";
import { educatorApplicationService } from "@/modules/educator-applications/educator-application.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = publicRoute(
  { body: educatorApplicationSchema, rateLimit: [{ name: "educator-application", limit: 4, windowMs: 3_600_000 }] },
  async ({ body }) => created(await educatorApplicationService.submit(body))
);

export const GET = protectedRoute(
  { roles: ["SUPERADMIN"] },
  ({ user }) => educatorApplicationService.list(user)
);
