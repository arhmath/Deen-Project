import { env } from "@/config/env";
import { logger } from "@/shared/logger";
import type { AuthUser } from "@/modules/users/user.types";
import type { ChatInput } from "./chat.schema";
import { getOwnedConversation, recentMessages, saveExchange } from "./conversation";
import { loadCourseChunks, loadCuratedChunks } from "./course-knowledge";
import {
  GREETING_REPLY, NO_CONTEXT, NO_RELIGIOUS_SOURCE, REFUSAL_INJECTION, REFUSAL_OUT_OF_SCOPE,
  classifyDomain, guardOutput, isAllowedDomain, isGreeting,
} from "./guards";
import { DEEN_KNOWLEDGE } from "./knowledge";
import { forcedKnowledge, routeIntent } from "./intent";
import { buildSystemPrompt } from "./prompt";
import { getProvider } from "./providers";
import { search } from "./retriever";
import { runTool } from "./tools";
import { parentService } from "@/modules/parent/parent.service";
import type { AIDomain, AISource, ChatTurn, ScoredChunk, ToolResult } from "./types";

const COURSE_DOMAINS = new Set<AIDomain>(["LEARNING", "COURSE", "MODULE", "CONTENT", "LESSON", "QUIZ", "PROGRESS", "RELIGIOUS_KNOWLEDGE", "DEEN_FEATURE"]);

const TOOL_SOURCE_TITLE: Record<AISource["type"], string> = {
  profile: "Data profilmu", progress: "Data belajar", notification: "Notifikasimu",
  knowledge: "Pengetahuan Deen", course: "Materi course", documentation: "Dokumentasi",
};
/** Label sumber yang aman untuk client — tanpa nama tool internal. */
export function toolSource(toolName: string, type: AISource["type"]): AISource {
  const title = toolName.startsWith("get_child_") ? "Data belajar anak"
    : /^get_(room|course|student|learning)_/.test(toolName) ? "Statistik pembelajaran"
    : TOOL_SOURCE_TITLE[type];
  return { id: `data:${type}`, title, type };
}

/** Ringkasan murah (tanpa LLM) dari pesan lama agar konteks tetap terbatas (AI_MAX_SUMMARY_TOKENS). */
export function summarizeOlder(older: ChatTurn[], maxTokens: number): string | null {
  const topics = older.filter((t) => t.role === "user").map((t) => t.content.replace(/\s+/g, " ").slice(0, 120));
  if (!topics.length) return null;
  return `Topik yang sudah dibahas sebelumnya: ${topics.join(" | ")}`.slice(0, maxTokens * 4);
}

export interface ChatOutcome {
  conversationId: string;
  messageId: string;
  content: string;
  createdAt: string;
  sources: AISource[];
  domain: AIDomain;
  grounded: boolean;
  refusal: boolean;
}

/**
 * Alur 05B §32: ownership → injection guard → domain guard → intent router → (RAG | tool terotorisasi)
 * → context builder → LLM → output guard → simpan → respons.
 * LLM hanya dipanggil bila ada konteks tervalidasi (grounded); selain itu jawaban standar yang aman.
 */
export async function handleChat(user: AuthUser, input: ChatInput): Promise<ChatOutcome> {
  const e = env();
  const conv = input.conversation_id ? await getOwnedConversation(input.conversation_id, user.id) : null; // 403/404
  const history = conv ? await recentMessages(conv.id, e.AI_MAX_RECENT_MESSAGES) : [];
  const message = input.message;
  const finish = async (content: string, domain: AIDomain, grounded: boolean, sources: AISource[], refusal: boolean, provider?: string, summary?: string | null): Promise<ChatOutcome> => {
    const saved = await saveExchange({
      conversationId: conv?.id ?? null, userId: user.id, title: message, userContent: message, assistantContent: content,
      metadata: { domain, grounded, sources, provider }, summary,
    });
    return { conversationId: saved.conversationId, messageId: saved.assistantMessageId, content, createdAt: saved.createdAt, sources, domain, grounded, refusal };
  };

  const domain = classifyDomain(message, conv?.lastDomain ?? null);
  if (domain === "PROMPT_INJECTION") {
    logger.warn("ai_prompt_injection_blocked", { userId: user.id });
    return finish(REFUSAL_INJECTION, domain, false, [], true);
  }
  if (!isAllowedDomain(domain)) return finish(REFUSAL_OUT_OF_SCOPE, domain, false, [], true);
  if (isGreeting(message) && message.trim().split(/\s+/).length <= 6 && !/\b(xp|level|room|quiz|kuis|course)\b/i.test(message)) {
    return finish(GREETING_REPLY, domain, false, [], false);
  }

  // ---- data dinamis lewat tool terotorisasi ----
  const toolResults: ToolResult[] = [];
  const toolNotes: string[] = [];
  const sources: AISource[] = [];
  // Orang tua sering menyebut nama anak (bukan kata "anak") → kenali nama anak yang terhubung.
  const childNames = user.role === "PARENT" ? (await parentService.students(user).catch(() => [])).flatMap((c) => c.name.split(" ")) : [];
  for (const name of routeIntent(message, user.role, childNames).tools) {
    const r = await runTool(name, { user, message });
    if (r.ok) {
      toolResults.push({ tool: name, data: r.data });
      // Jangan membuka nama tool internal ke client (05B §13) — tampilkan label ramah.
      const src = toolSource(name, r.source);
      if (!sources.some((s) => s.id === src.id)) sources.push(src);
    } else toolNotes.push(r.note);
  }

  // ---- pengetahuan statis lewat RAG ----
  const corpus = DEEN_KNOWLEDGE.filter((c) => c.id !== "kb-about"); // kb-about hanya lewat forcedKnowledge()
  const [course, curated] = await Promise.all([
    COURSE_DOMAINS.has(domain) ? loadCourseChunks(user).catch(() => []) : Promise.resolve([]),
    loadCuratedChunks(user.role).catch(() => []),
  ]);
  corpus.push(...course, ...curated);
  const hits: ScoredChunk[] = search(message, corpus, e.AI_RAG_TOP_K, e.AI_RAG_MIN_SCORE);
  // Niat yang tidak bisa ditangkap skor leksikal ("Apa itu Deen?", pencarian lokasi) → sertakan chunk resmi secara eksplisit.
  for (const id of forcedKnowledge(message, domain)) {
    const chunk = DEEN_KNOWLEDGE.find((c) => c.id === id);
    if (chunk && !hits.some((h) => h.chunk.id === id)) hits.unshift({ chunk, score: 1 });
  }
  for (const h of hits) {
    const id = h.chunk.id.split("#")[0]!;
    if (!sources.some((s) => s.id === id)) sources.push({ id, title: h.chunk.title, type: h.chunk.type });
  }

  const grounded = hits.length > 0 || toolResults.length > 0;
  if (!grounded) {
    if (toolNotes.length) return finish(toolNotes.join(" "), domain, false, [], false);
    return finish(domain === "RELIGIOUS_KNOWLEDGE" ? NO_RELIGIOUS_SOURCE : NO_CONTEXT, domain, false, [], false);
  }
  // Materi keagamaan harus berasal dari sumber Deen; jawaban dari tool saja tidak cukup untuk topik ini.
  if (domain === "RELIGIOUS_KNOWLEDGE" && !hits.some((h) => h.chunk.type !== "knowledge" || !h.chunk.id.startsWith("kb-"))) {
    return finish(NO_RELIGIOUS_SOURCE, domain, false, [], false);
  }

  // ---- context builder → LLM ----
  const older = history.length >= e.AI_MAX_RECENT_MESSAGES ? history.slice(0, history.length - 6) : [];
  const summary = conv?.summary ?? null;
  const provider = getProvider();
  const raw = await provider.generateReply({
    system: buildSystemPrompt({ role: user.role, chunks: hits, tools: toolResults, summary, toolNotes }),
    messages: [...history, { role: "user", content: message }],
    maxTokens: 700,
    timeoutMs: e.AI_TIMEOUT_MS,
    context: { domain, userMessage: message, chunks: hits, tools: toolResults },
  });

  const guarded = guardOutput(raw || NO_CONTEXT);
  if (!guarded.ok) logger.warn("ai_output_guard_blocked", { userId: user.id });
  const newSummary = older.length ? summarizeOlder(older, e.AI_MAX_SUMMARY_TOKENS) : undefined;
  return finish(guarded.text, domain, guarded.ok, sources, false, provider.name, newSummary);
}
