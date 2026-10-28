import { noContent, protectedRoute } from "@/shared/http";
import { updateContentSchema } from "@/modules/courses/course.schema";
import { courseService } from "@/modules/courses/course.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ roles: ["SANTRI", "ADMIN", "SUPERADMIN"] }, ({ user, params }) => courseService.getContent(user, params.contentId!));
export const PATCH = protectedRoute({ roles: ["ADMIN", "SUPERADMIN"], body: updateContentSchema }, ({ user, params, body }) =>
  courseService.updateContent(user, params.contentId!, body)
);
export const DELETE = protectedRoute({ roles: ["ADMIN", "SUPERADMIN"] }, async ({ user, params }) => {
  await courseService.deleteContent(user, params.contentId!);
  return noContent();
});
