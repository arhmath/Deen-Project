import { db, toIso, ts } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { createRoomSchema } from "@/modules/rooms/room.schema";
import { roomService } from "@/modules/rooms/room.service";
import { protectedRoute, created } from "@/shared/http";
import type { RoomDoc } from "@/modules/rooms/room.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const roomSummary = (room: RoomDoc & { id: string }, courseCount: number) => ({
  id: room.id,
  name: room.name,
  joinCode: room.joinCode,
  memberCount: room.memberCount,
  courseCount,
  archived: room.status === "ARCHIVED",
  createdAt: toIso(room.createdAt),
});

export const GET = protectedRoute({ roles: ["ADMIN"] }, async ({ user }) => {
  const snap = await db().collection(C.rooms).where("ownerId", "==", user.id).get();
  const rooms = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as RoomDoc) }))
    .filter((room) => !room.deletedAt)
    .sort((a, b) => a.name.localeCompare(b.name));

  const counts = await Promise.all(
    rooms.map(async (room) => {
      const coursesSnap = await db().collection(C.courses).where("roomId", "==", room.id).where("deletedAt", "==", null).get();
      return [room.id, coursesSnap.size] as const;
    }),
  );
  const countMap = new Map<string, number>(counts);
  return rooms.map((room) => roomSummary(room, countMap.get(room.id) ?? 0));
});

export const POST = protectedRoute({ roles: ["ADMIN"], body: createRoomSchema }, async ({ user, body }) => {
  const createdRoom = await roomService.create(user, body);
  const roomSnap = await db().collection(C.rooms).doc(createdRoom.id).get();
  const room = roomSnap.data() as RoomDoc | undefined;
  const coursesSnap = await db().collection(C.courses).where("roomId", "==", createdRoom.id).where("deletedAt", "==", null).get();

  return created({
    id: createdRoom.id,
    name: room?.name ?? createdRoom.name,
    joinCode: room?.joinCode ?? createdRoom.joinCode,
    memberCount: room?.memberCount ?? createdRoom.memberCount,
    courseCount: coursesSnap.size,
    archived: (room?.status ?? "ACTIVE") === "ARCHIVED",
    createdAt: toIso(room?.createdAt ?? ts()),
  });
});
