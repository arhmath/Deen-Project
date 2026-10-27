import { noContent, protectedRoute } from "@/shared/http";
import { updateRoomSchema } from "@/modules/rooms/room.schema";
import { roomService } from "@/modules/rooms/room.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ roles: ["SANTRI", "ADMIN"] }, ({ user, params }) => roomService.get(user, params.roomId!));
export const PATCH = protectedRoute({ roles: ["ADMIN"], body: updateRoomSchema }, ({ user, params, body }) =>
  roomService.update(user, params.roomId!, body)
);
export const DELETE = protectedRoute({ roles: ["ADMIN"] }, async ({ user, params }) => {
  await roomService.archive(user, params.roomId!);
  return noContent();
});
