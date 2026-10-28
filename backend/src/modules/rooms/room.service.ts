import { FieldValue, db, toIso, ts } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
import { docId, generateJoinCode, newId } from "@/shared/ids";
import { getByIds } from "@/shared/firestore-utils";
import { uniqueRef } from "@/shared/unique";
import { auditInTx } from "../audit/audit";
import { initialGamification } from "../gamification/gamification.logic";
import { gamRef } from "../gamification/gamification.repository";
import type { UserGamificationDoc } from "../gamification/gamification.types";
import { notifyInTx } from "../notifications/notification.service";
import type { AuthUser, UserDoc } from "../users/user.types";
import { assertRoomOwner, isActiveMember, loadRoom, activeRoomIdsOfStudent, ownedRoomIds } from "./room.access";
import type { CreateRoomInput, JoinRoomInput, UpdateRoomInput } from "./room.schema";
import type { RoomDoc, RoomMemberDoc } from "./room.types";

export interface RoomSummary {
  id: string;
  name: string;
  memberCount: number;
  description?: string | null;
  status?: string;
  /** join code hanya dikirim ke pemilik room */
  joinCode?: string;
}

const toSummary = (id: string, r: RoomDoc, owner: boolean): RoomSummary => ({
  id,
  name: r.name,
  memberCount: r.memberCount,
  ...(owner ? { description: r.description, status: r.status, joinCode: r.joinCode } : {}),
});

export const roomService = {
  async create(admin: AuthUser, input: CreateRoomInput) {
    const id = crypto.randomUUID();
    const now = ts();
    for (let attempt = 0; attempt < 6; attempt++) {
      const joinCode = generateJoinCode();
      const codeRef = uniqueRef("joinCode", joinCode);
      try {
        await db().runTransaction(async (tx) => {
          if ((await tx.get(codeRef)).exists) throw Object.assign(new Error("dup"), { dupCode: true });
          const doc: RoomDoc = {
            ownerId: admin.id,
            name: input.name,
            description: input.description ?? null,
            joinCode,
            status: "ACTIVE",
            memberCount: 0,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
          };
          tx.create(db().collection(C.rooms).doc(id), doc);
          tx.create(codeRef, { roomId: id, type: "joinCode", createdAt: now });
          auditInTx(tx, { actorId: admin.id, action: "ROOM_CREATED", entityType: "room", entityId: id });
        });
        return { id, name: input.name, description: input.description ?? null, joinCode, status: "ACTIVE", memberCount: 0 };
      } catch (err) {
        if ((err as { dupCode?: boolean }).dupCode) continue; // tabrakan kode (sangat jarang) → coba kode lain
        throw err;
      }
    }
    throw Errors.unavailable("Gagal membuat kode room. Coba lagi.");
  },

  /** GET /rooms — hanya room yang boleh dilihat user (SANTRI: yang diikuti, ADMIN: miliknya, PARENT: room anaknya). */
  async list(user: AuthUser): Promise<RoomSummary[]> {
    let ids: string[] = [];
    if (user.role === "SANTRI") ids = await activeRoomIdsOfStudent(user.id);
    else if (user.role === "ADMIN") ids = await ownedRoomIds(user.id);
    else {
      const links = await db().collection(C.parentStudents).where("parentId", "==", user.id).where("status", "==", "ACTIVE").get();
      const sets = await Promise.all(links.docs.map((d) => activeRoomIdsOfStudent(d.data().studentId as string)));
      ids = sets.flat();
    }
    const rooms = await getByIds<RoomDoc>(C.rooms, ids);
    return rooms
      .filter((r) => !r.data.deletedAt && r.data.status === "ACTIVE")
      .map((r) => toSummary(r.id, r.data, user.role === "ADMIN" && r.data.ownerId === user.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async get(user: AuthUser, roomId: string) {
    const room = await loadRoom(roomId);
    if (user.role === "ADMIN") {
      if (room.ownerId !== user.id) throw Errors.forbidden("Room ini bukan milikmu.");
    } else if (user.role === "SANTRI") {
      if (!(await isActiveMember(roomId, user.id))) throw Errors.forbidden("Kamu bukan anggota room ini.");
    } else {
      throw Errors.forbidden();
    }
    return { ...toSummary(roomId, room, room.ownerId === user.id), createdAt: toIso(room.createdAt) };
  },

  async update(admin: AuthUser, roomId: string, input: UpdateRoomInput) {
    await assertRoomOwner(admin, roomId);
    const patch: Record<string, unknown> = { updatedAt: ts() };
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.archived !== undefined) patch.status = input.archived ? "ARCHIVED" : "ACTIVE";
    await db().runTransaction(async (tx) => {
      tx.update(db().collection(C.rooms).doc(roomId), patch);
      if (input.archived !== undefined) {
        auditInTx(tx, { actorId: admin.id, action: input.archived ? "ROOM_ARCHIVED" : "ROOM_RESTORED", entityType: "room", entityId: roomId });
      }
    });
    return this.get(admin, roomId);
  },

  /** DELETE /rooms/:id → diarsipkan (soft), bukan dihapus. */
  async archive(admin: AuthUser, roomId: string): Promise<void> {
    await assertRoomOwner(admin, roomId);
    await db().runTransaction(async (tx) => {
      tx.update(db().collection(C.rooms).doc(roomId), { status: "ARCHIVED", updatedAt: ts() });
      auditInTx(tx, { actorId: admin.id, action: "ROOM_ARCHIVED", entityType: "room", entityId: roomId });
    });
  },

  /**
   * Hapus room dari arsip (soft delete). Hanya room ARCHIVED yang boleh dihapus.
   * Course di dalamnya ikut disembunyikan (deletedAt) supaya tidak jadi data yatim di daftar admin.
   */
  async remove(admin: AuthUser, roomId: string): Promise<void> {
    const room = await assertRoomOwner(admin, roomId);
    if (room.status !== "ARCHIVED") throw Errors.conflict("Arsipkan room dulu sebelum menghapusnya.");
    const courses = await db().collection(C.courses).where("roomId", "==", roomId).where("deletedAt", "==", null).get();
    const now = ts();
    const batch = db().batch();
    batch.update(db().collection(C.rooms).doc(roomId), { deletedAt: now, updatedAt: now });
    courses.docs.forEach((c) => batch.update(c.ref, { deletedAt: now, updatedAt: now }));
    batch.set(db().collection(C.auditLogs).doc(newId()), {
      actorId: admin.id, action: "ROOM_DELETED", entityType: "room", entityId: roomId, metadata: { courses: courses.size }, createdAt: now,
    });
    await batch.commit();
  },

  /** POST /rooms/join — SANTRI bergabung dengan kode (BR-002, BR-014). */
  async join(user: AuthUser, input: JoinRoomInput) {
    const code = input.joinCode.toUpperCase();
    const keySnap = await uniqueRef("joinCode", code).get();
    const roomId = keySnap.data()?.roomId as string | undefined;
    if (!roomId) throw Errors.notFound("Kode room");

    const roomRef = db().collection(C.rooms).doc(roomId);
    const memberRef = db().collection(C.roomMembers).doc(docId(roomId, user.id));
    const userRef = db().collection(C.users).doc(user.id);
    const now = ts();

    const summary = await db().runTransaction(async (tx) => {
      const [rSnap, mSnap, gSnap, uSnap] = await tx.getAll(roomRef, memberRef, gamRef(user.id), userRef);
      const room = rSnap.data() as RoomDoc | undefined;
      if (!room || room.deletedAt) throw Errors.notFound("Kode room");
      if (room.status !== "ACTIVE") throw Errors.conflict("Room ini sudah tidak aktif.");
      if (mSnap.exists && (mSnap.data() as RoomMemberDoc).isActive) throw Errors.conflict("Kamu sudah bergabung di room ini.");

      const u = uSnap.data() as UserDoc;
      tx.set(memberRef, { roomId, userId: user.id, isActive: true, joinedAt: now } satisfies RoomMemberDoc);
      tx.update(roomRef, { memberCount: FieldValue.increment(1), updatedAt: now });
      if (gSnap.exists) tx.update(gamRef(user.id), { roomIds: FieldValue.arrayUnion(roomId) });
      else tx.set(gamRef(user.id), { ...initialGamification(user.id, u.name, u.username, now), roomIds: [roomId] } satisfies UserGamificationDoc);
      notifyInTx(tx, {
        userId: room.ownerId, type: "ROOM", title: "Santri baru bergabung",
        message: `${u.name} bergabung ke ${room.name}.`, data: { roomId, studentId: user.id },
      });
      auditInTx(tx, { actorId: user.id, action: "ROOM_JOINED", entityType: "room", entityId: roomId });
      return { id: roomId, name: room.name, memberCount: room.memberCount + 1 };
    });

    const { progressService } = await import("../progress/progress.service");
    await progressService.refreshCourseProgress(user.id).catch(() => undefined);
    return summary;
  },

  async members(admin: AuthUser, roomId: string) {
    await assertRoomOwner(admin, roomId);
    const snap = await db().collection(C.roomMembers).where("roomId", "==", roomId).where("isActive", "==", true).get();
    const ids = snap.docs.map((d) => (d.data() as RoomMemberDoc).userId);
    const [users, gams] = await Promise.all([getByIds<UserDoc>(C.users, ids), getByIds<UserGamificationDoc>(C.userGamification, ids)]);
    const gMap = new Map(gams.map((g) => [g.id, g.data]));
    const joined = new Map(snap.docs.map((d) => [(d.data() as RoomMemberDoc).userId, toIso((d.data() as RoomMemberDoc).joinedAt)]));
    return users
      .filter((u) => !u.data.deletedAt)
      .map((u) => ({
        id: u.id, name: u.data.name, username: u.data.username,
        level: gMap.get(u.id)?.level ?? 1, xp: gMap.get(u.id)?.totalXp ?? 0, joinedAt: joined.get(u.id) ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async removeMember(admin: AuthUser, roomId: string, studentId: string): Promise<void> {
    await assertRoomOwner(admin, roomId);
    const roomRef = db().collection(C.rooms).doc(roomId);
    const memberRef = db().collection(C.roomMembers).doc(docId(roomId, studentId));
    await db().runTransaction(async (tx) => {
      const [mSnap, gSnap] = await tx.getAll(memberRef, gamRef(studentId));
      if (!mSnap.exists || !(mSnap.data() as RoomMemberDoc).isActive) throw Errors.notFound("Anggota room");
      tx.update(memberRef, { isActive: false });
      tx.update(roomRef, { memberCount: FieldValue.increment(-1), updatedAt: ts() });
      if (gSnap.exists) tx.update(gamRef(studentId), { roomIds: FieldValue.arrayRemove(roomId) });
      auditInTx(tx, { actorId: admin.id, action: "ROOM_MEMBER_REMOVED", entityType: "room", entityId: roomId, metadata: { studentId } });
    });
  },
};
