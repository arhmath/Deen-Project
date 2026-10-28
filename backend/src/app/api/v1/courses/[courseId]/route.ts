import { noContent, protectedRoute } from "@/shared/http";
import { updateCourseSchema } from "@/modules/courses/course.schema";
import { courseService } from "@/modules/courses/course.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ roles: ["SANTRI", "ADMIN", "SUPERADMIN"] }, ({ user, params }) => courseService.get(user, params.courseId!));
export const PATCH = protectedRoute({ roles: ["ADMIN", "SUPERADMIN"], body: updateCourseSchema }, ({ user, params, body }) =>
  courseService.update(user, params.courseId!, body)
);
export const DELETE = protectedRoute({ roles: ["ADMIN", "SUPERADMIN"] }, async ({ user, params }) => {
  await courseService.archive(user, params.courseId!);
  return noContent();
});
