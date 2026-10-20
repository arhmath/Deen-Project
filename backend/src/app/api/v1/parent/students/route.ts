import { protectedRoute } from "@/shared/http";
import { parentService } from "@/modules/parent/parent.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ roles: ["PARENT"] }, ({ user }) => parentService.students(user));
