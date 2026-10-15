import type { Timestamp } from "firebase-admin/firestore";
import { FieldValue, db, toIso, ts } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
import { newId } from "@/shared/ids";
import type { AIDomain, AISource, ChatTurn } from "./types";

export interface ConversationDoc {
  userId: string;
  title: string;
  summary: string | null;
  lastDomain: AIDomain | null;
  messageCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MessageDoc {
  conversationId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  metadata: { domain?: AIDomain; grounded?: boolean; sources?: AISource[]; provider?: string };
  createdAt: Timestamp;
}

/** Hanya pemilik yang boleh mengakses conversation — termasuk ADMIN (05B §10). */
export async function getOwnedConversation(conversationId: string, userId: string) {
  const snap = await db().collection(C.chatConversations).doc(conversationId).get();
  const c = snap.data() as ConversationDoc | undefined;
  if (!c) throw Errors.notFound("Percakapan");
  if (c.userId !== userId) throw Errors.forbidden("Percakapan ini bukan milikmu.");
  return { id: snap.id, ...c };
}

export async function recentMessages(conversationId: string, limit: number): Promise<ChatTurn[]> {
  const snap = await db().collection(C.chatMessages).where("conversationId", "==", conversationId).orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.reverse().map((d) => {
    const m = d.data() as MessageDoc;
    return { role: m.role, content: m.content };
  });
}

export interface ExchangeInput {
  conversationId: string | null;
  userId: string;
  title: string;
  userContent: string;
  assistantContent: string;
  metadata: MessageDoc["metadata"];
  summary?: string | null;
}

/** Simpan pesan user + jawaban AI (dan buat conversation bila baru) secara atomik. */
export async function saveExchange(x: ExchangeInput) {
  const now = new Date();
  const convId = x.conversationId ?? newId();
  const userMsgId = newId();
  const assistantMsgId = newId();
  const batch = db().batch();
  const convRef = db().collection(C.chatConversations).doc(convId);

  if (!x.conversationId) {
    batch.create(convRef, {
      userId: x.userId, title: x.title.slice(0, 80), summary: null, lastDomain: x.metadata.domain ?? null,
      messageCount: 2, createdAt: ts(now), updatedAt: ts(now),
    } satisfies ConversationDoc);
  } else {
    batch.update(convRef, {
      messageCount: FieldValue.increment(2), updatedAt: ts(now), lastDomain: x.metadata.domain ?? null,
      ...(x.summary !== undefined ? { summary: x.summary } : {}),
    });
  }
  batch.create(db().collection(C.chatMessages).doc(userMsgId), {
    conversationId: convId, userId: x.userId, role: "user", content: x.userContent, metadata: {}, createdAt: ts(now),
  } satisfies MessageDoc);
  // createdAt assistant +1ms agar urutan stabil
  batch.create(db().collection(C.chatMessages).doc(assistantMsgId), {
    conversationId: convId, userId: x.userId, role: "assistant", content: x.assistantContent,
    metadata: x.metadata, createdAt: ts(new Date(now.getTime() + 1)),
  } satisfies MessageDoc);
  await batch.commit();
  return { conversationId: convId, assistantMessageId: assistantMsgId, createdAt: new Date(now.getTime() + 1).toISOString() };
}

export const conversationService = {
  async list(userId: string, page: number, limit: number) {
    const base = db().collection(C.chatConversations).where("userId", "==", userId);
    const total = (await base.count().get()).data().count;
    const snap = await base.orderBy("updatedAt", "desc").offset((page - 1) * limit).limit(limit).get();
    return {
      message: "Daftar percakapan berhasil diambil",
      data: snap.docs.map((d) => {
        const c = d.data() as ConversationDoc;
        return { id: d.id, title: c.title, message_count: c.messageCount, created_at: toIso(c.createdAt), updated_at: toIso(c.updatedAt) };
      }),
      meta: { page, limit, total },
    };
  },

  async detail(userId: string, id: string) {
    const conv = await getOwnedConversation(id, userId);
    const snap = await db().collection(C.chatMessages).where("conversationId", "==", id).orderBy("createdAt", "asc").limit(500).get();
    return {
      message: "Percakapan berhasil diambil",
      data: {
        id, title: conv.title, created_at: toIso(conv.createdAt),
        messages: snap.docs.map((d) => {
          const m = d.data() as MessageDoc;
          return { id: d.id, role: m.role, content: m.content, created_at: toIso(m.createdAt), ...(m.role === "assistant" ? { sources: m.metadata.sources ?? [] } : {}) };
        }),
      },
    };
  },

  async remove(userId: string, id: string): Promise<void> {
    await getOwnedConversation(id, userId);
    const msgs = await db().collection(C.chatMessages).where("conversationId", "==", id).get();
    for (let i = 0; i < msgs.docs.length; i += 400) {
      const batch = db().batch();
      msgs.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await db().collection(C.chatConversations).doc(id).delete();
  },

  async feedback(userId: string, messageId: string, input: { rating: "positive" | "negative"; comment?: string }) {
    const mRef = db().collection(C.chatMessages).doc(messageId);
    const fRef = db().collection(C.aiFeedback).doc(messageId);
    await db().runTransaction(async (tx) => {
      const [m, f] = await tx.getAll(mRef, fRef);
      const msg = m.data() as MessageDoc | undefined;
      if (!msg || msg.role !== "assistant") throw Errors.notFound("Pesan");
      if (msg.userId !== userId) throw Errors.forbidden("Pesan ini bukan milikmu.");
      if (f.exists) throw Errors.conflict("Kamu sudah memberi umpan balik untuk pesan ini.");
      tx.create(fRef, { messageId, conversationId: msg.conversationId, userId, rating: input.rating, comment: input.comment ?? null, createdAt: ts() });
    });
    return { message: "Umpan balik berhasil disimpan" };
  },
};
