import { created, protectedRoute } from "@/shared/http";
import { createContentSchema } from "@/modules/courses/course.schema";
import { courseService } from "@/modules/courses/course.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ roles: ["SANTRI", "ADMIN"] }, ({ user, params }) => courseService.listContents(user, params.moduleId!));
export const POST = protectedRoute({ roles: ["ADMIN"], body: createContentSchema }, async ({ user, params, body }) =>
  created(await courseService.createContent(user, params.moduleId!, body))
);
