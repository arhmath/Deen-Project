import { created, protectedRoute } from "@/shared/http";
import { createRoomSchema } from "@/modules/rooms/room.schema";
import { roomService } from "@/modules/rooms/room.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({}, ({ user }) => roomService.list(user));
export const POST = protectedRoute({ roles: ["ADMIN"], body: createRoomSchema }, async ({ user, body }) =>
  created(await roomService.create(user, body))
);
