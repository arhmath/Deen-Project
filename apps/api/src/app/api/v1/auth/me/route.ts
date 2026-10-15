import { protectedRoute } from "@/shared/http";
import { authService } from "@/modules/auth/auth.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({}, ({ user }) => authService.me(user.id));
