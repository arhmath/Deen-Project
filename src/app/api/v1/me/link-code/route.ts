import { protectedRoute } from "@/shared/http";
import { userService } from "@/modules/users/user.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = protectedRoute({ roles: ["SANTRI"] }, ({ user }) => userService.getLinkCode(user.id));
