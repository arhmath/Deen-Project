import { protectedRoute } from "@/shared/http";
import { legacyCourseDetail } from "@/modules/progress/compat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = protectedRoute({ roles: ["SANTRI"] }, ({ user, params }) => legacyCourseDetail(user, params.courseId!));
