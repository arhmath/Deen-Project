import { protectedRoute } from "@/shared/http";
import { roomService } from "@/modules/rooms/room.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const DELETE = protectedRoute({ roles: ["ADMIN", "SUPERADMIN"] }, async ({ user, params }) => {
  await roomService.removeMember(user, params.roomId!, params.studentId!);
  return { ok: true };
});
