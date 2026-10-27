import { protectedRoute } from "@/shared/http";
import { roomService } from "@/modules/rooms/room.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ roles: ["ADMIN"] }, ({ user, params }) => roomService.members(user, params.roomId!));
