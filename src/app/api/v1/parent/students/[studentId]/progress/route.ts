import { protectedRoute } from "@/shared/http";
import { parentService } from "@/modules/parent/parent.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Alias kontrak OpenAPI (/parent/students/{studentId}/progress).
export const GET = protectedRoute({ roles: ["PARENT"] }, ({ user, params }) => parentService.student(user, params.studentId!));
