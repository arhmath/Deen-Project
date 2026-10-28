import { created, protectedRoute } from "@/shared/http";
import { createModuleSchema } from "@/modules/courses/course.schema";
import { courseService } from "@/modules/courses/course.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ roles: ["SANTRI", "ADMIN", "SUPERADMIN"] }, ({ user, params }) => courseService.listModules(user, params.courseId!));
export const POST = protectedRoute({ roles: ["ADMIN", "SUPERADMIN"], body: createModuleSchema }, async ({ user, params, body }) =>
  created(await courseService.createModule(user, params.courseId!, body))
);
