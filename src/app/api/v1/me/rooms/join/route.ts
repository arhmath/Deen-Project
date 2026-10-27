import { protectedRoute } from "@/shared/http";
import { joinRoomSchema } from "@/modules/rooms/room.schema";
import { roomService } from "@/modules/rooms/room.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = protectedRoute(
  { roles: ["SANTRI"], body: joinRoomSchema, rateLimit: [{ name: "join-room", limit: 10, windowMs: 60_000, by: "user" }] },
  ({ user, body }) => roomService.join(user, body)
);
