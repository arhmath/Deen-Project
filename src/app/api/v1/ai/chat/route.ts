import { protectedRoute } from "@/shared/http";
import { chatSchema } from "@/ai/chat.schema";
import { handleChat } from "@/ai/orchestrator";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Rate limit 5/10 dtk dan 30/menit per user (05B §26). Penolakan domain = 200 (bukan error).
export const POST = protectedRoute(
  { body: chatSchema, errorStyle: "ai", rateLimit: [{ name: "ai-10s", limit: 5, windowMs: 10_000, by: "user" }, { name: "ai-1m", limit: 30, windowMs: 60_000, by: "user" }] },
  async ({ user, body }) => {
    const r = await handleChat(user, body);
    return {
      message: r.refusal ? (r.domain === "PROMPT_INJECTION" ? "Permintaan tidak dapat diproses" : "Pertanyaan berada di luar cakupan Deen") : "Pesan AI berhasil diproses",
      data: {
        conversation_id: r.conversationId,
        message: { id: r.messageId, role: "assistant", content: r.content, created_at: r.createdAt },
        sources: r.sources,
        meta: { intent: r.domain, domain: r.domain, grounded: r.grounded, ai: r.ai },
        // Pemakaian token hari ini (hanya bila LLM dipakai / batas tercapai); client mempertahankan nilai sebelumnya bila null.
        usage: r.usage,
      },
    };
  }
);
