import { protectedRoute } from "@/shared/http";
import { progressService } from "@/modules/progress/progress.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = protectedRoute({ roles: ["SANTRI"] }, ({ user }) => progressService.adventureForStudent(user.id));
