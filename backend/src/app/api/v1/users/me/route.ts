import { protectedRoute } from "@/shared/http";
import { updateProfileSchema } from "@/modules/auth/auth.schema";
import { userService } from "@/modules/users/user.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({}, ({ user }) => userService.getMe(user.id));
export const PATCH = protectedRoute({ body: updateProfileSchema }, ({ user, body }) => userService.updateMe(user.id, body));
