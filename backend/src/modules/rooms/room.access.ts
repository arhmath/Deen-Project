import { db } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
import { docId } from "@/shared/ids";
import type { AuthUser } from "../users/user.types";
import type { RoomDoc, RoomMemberDoc } from "./room.types";

export async function loadRoom(roomId: string): Promise<RoomDoc> {
  const snap = await db().collection(C.rooms).doc(roomId).get();
  const r = snap.data() as RoomDoc | undefined;
  if (!r || r.deletedAt) throw Errors.notFound("Room");
  return r;
}

/** ADMIN hanya boleh mengelola room miliknya (BR-004). */
export async function assertRoomOwner(user: AuthUser, roomId: string): Promise<RoomDoc> {
  const r = await loadRoom(roomId);
  if (user.role !== "SUPERADMIN" && r.ownerId !== user.id) throw Errors.forbidden("Room ini bukan milikmu.");
  return r;
}

export async function isActiveMember(roomId: string, userId: string): Promise<boolean> {
  const snap = await db().collection(C.roomMembers).doc(docId(roomId, userId)).get();
  return snap.exists && (snap.data() as RoomMemberDoc).isActive === true;
}

export async function activeRoomIdsOfStudent(userId: string): Promise<string[]> {
  const snap = await db().collection(C.roomMembers).where("userId", "==", userId).where("isActive", "==", true).get();
  return snap.docs.map((d) => (d.data() as RoomMemberDoc).roomId);
}

export async function ownedRoomIds(adminId: string, includeArchived = false): Promise<string[]> {
  let q = db().collection(C.rooms).where("ownerId", "==", adminId);
  if (!includeArchived) q = q.where("status", "==", "ACTIVE");
  const snap = await q.get();
  return snap.docs.filter((d) => !(d.data() as RoomDoc).deletedAt).map((d) => d.id);
}
