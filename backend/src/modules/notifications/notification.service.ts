import type { Timestamp, Transaction } from "firebase-admin/firestore";
import { z } from "zod";
import { db, toIso, ts } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
import { newId } from "@/shared/ids";

export type NotificationType = "COURSE" | "ROOM" | "ACHIEVEMENT" | "SYSTEM" | "ACTIVITY";

export interface NotificationDoc {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  readAt: Timestamp | null;
  createdAt: Timestamp;
}

export interface NotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

/** Antrikan notifikasi di dalam transaksi (event-driven, atomik dengan perubahan domain). */
export function notifyInTx(tx: Transaction, n: NotificationInput) {
  const doc: NotificationDoc = {
    userId: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    data: n.data ?? {},
    readAt: null,
    createdAt: ts(),
  };
  tx.set(db().collection(C.notifications).doc(newId()), doc);
}

export const listNotificationsQuery = z.object({
  unread: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const notificationService = {
  async list(userId: string, q: z.output<typeof listNotificationsQuery>) {
    let query = db().collection(C.notifications).where("userId", "==", userId);
    if (q.unread === "true") query = query.where("readAt", "==", null);
    const total = (await query.count().get()).data().count;
    const unreadCount = (
      await db().collection(C.notifications).where("userId", "==", userId).where("readAt", "==", null).count().get()
    ).data().count;
    const snap = await query
      .orderBy("createdAt", "desc")
      .offset((q.page - 1) * q.limit)
      .limit(q.limit)
      .get();
    return {
      items: snap.docs.map((d) => {
        const n = d.data() as NotificationDoc;
        return {
          id: d.id,
          type: n.type,
          title: n.title,
          message: n.message,
          data: n.data,
          read: n.readAt !== null,
          createdAt: toIso(n.createdAt),
        };
      }),
      page: q.page,
      limit: q.limit,
      total,
      unreadCount,
    };
  },

  async markRead(userId: string, id: string): Promise<void> {
    const ref = db().collection(C.notifications).doc(id);
    await db().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const n = snap.data() as NotificationDoc | undefined;
      // 404 (bukan 403) agar keberadaan notifikasi milik orang lain tidak bocor.
      if (!n || n.userId !== userId) throw Errors.notFound("Notifikasi");
      if (n.readAt === null) tx.update(ref, { readAt: ts() });
    });
  },
};
