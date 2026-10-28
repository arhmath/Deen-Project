import { noContent, protectedRoute } from "@/shared/http";
import { updateModuleSchema } from "@/modules/courses/course.schema";
import { courseService } from "@/modules/courses/course.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const PATCH = protectedRoute({ roles: ["ADMIN", "SUPERADMIN"], body: updateModuleSchema }, ({ user, params, body }) =>
  courseService.updateModule(user, params.moduleId!, body)
);
export const DELETE = protectedRoute({ roles: ["ADMIN", "SUPERADMIN"] }, async ({ user, params }) => {
  await courseService.deleteModule(user, params.moduleId!);
  return noContent();
});
