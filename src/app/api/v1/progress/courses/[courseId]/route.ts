import { protectedRoute } from "@/shared/http";
import { courseProgressQuery } from "@/modules/progress/learning.schema";
import { progressService } from "@/modules/progress/progress.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ roles: ["SANTRI", "ADMIN"], query: courseProgressQuery }, ({ user, params, query }) =>
  progressService.course(user, params.courseId!, query.studentId)
);
