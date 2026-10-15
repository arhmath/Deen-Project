import { created, protectedRoute } from "@/shared/http";
import { createCourseSchema, listCoursesQuery } from "@/modules/courses/course.schema";
import { courseService } from "@/modules/courses/course.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ roles: ["SANTRI", "ADMIN"], query: listCoursesQuery }, ({ user, query }) => courseService.list(user, query));
export const POST = protectedRoute({ roles: ["ADMIN"], body: createCourseSchema }, async ({ user, body }) =>
  created(await courseService.create(user, body))
);
