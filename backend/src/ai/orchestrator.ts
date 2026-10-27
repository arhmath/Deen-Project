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
import { buildGeneralPrompt, buildSystemPrompt } from "./prompt";
import { describeProvider, estimateTokens, getProvider, localProvider } from "./providers";
import { search } from "./retriever";
import { runTool } from "./tools";
import { isExhausted, makeSnapshot, readUsage, recordUsage } from "./usage";
import { parentService } from "@/modules/parent/parent.service";
import type { AIDomain, AIMessageMeta, AIMode, AIRequest, AISource, ChatTurn, ProviderReply, ScoredChunk, TokenUsage, ToolResult, UsageSnapshot } from "./types";

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
  /** Mesin penjawab (LLM atau aturan) + token pesan ini. */
  ai: AIMessageMeta;
  /** Pemakaian token hari ini; null bila LLM tidak dipakai atau tidak terbaca. */
  usage: UsageSnapshot | null;
}

const RULES_LABEL = "Aturan Deen";
const rulesMeta = (reason?: AIMessageMeta["reason"]): AIMessageMeta => ({
  engine: "rules", label: RULES_LABEL, provider: "local", model: null, mode: "rules", tokens: null, ...(reason ? { reason } : {}),
});
const LIMIT_NOTE = "Batas token AI hari ini sudah habis, jadi aku hanya bisa menjawab dari materi dan data Deen. Coba lagi besok ya.";
// Pertanyaan tombol saran harus selalu bebas LLM, termasuk saat retrieval gagal menemukan sumber.
const SUGGESTION_ONLY = new Set([
  "apa itu xp di deen?",
  "bagaimana cara mengerjakan quiz?",
  "berapa xp saya sekarang?",
  "bagaimana cara join room?",
  "bagaimana orang tua melihat progress anak?",
  "bagaimana progress anak saya?",
  "apa itu streak?",
  "berikan ringkasan statistik belajar",
  "santri mana yang perlu perhatian?",
  "bagaimana struktur course dan modul?",
]);

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
  const finish = async (
    content: string, domain: AIDomain, grounded: boolean, sources: AISource[], refusal: boolean,
    ai: AIMessageMeta = rulesMeta(), summary?: string | null, usage: UsageSnapshot | null = null
  ): Promise<ChatOutcome> => {
    const saved = await saveExchange({
      conversationId: conv?.id ?? null, userId: user.id, title: message, userContent: message, assistantContent: content,
      metadata: { domain, grounded, sources, provider: ai.provider, ai }, summary,
    });
    return { conversationId: saved.conversationId, messageId: saved.assistantMessageId, content, createdAt: saved.createdAt, sources, domain, grounded, refusal, ai, usage };
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

  // FAQ statis yang sudah disediakan dipetakan langsung ke knowledge terkurasi.
  // Ini menghindari pembacaan Firestore (course/curated KB) dan retrieval seluruh korpus pada FAQ umum.
  const normalizedQuestion = message.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const directKnowledgeIds = (() => {
    if (/^(apa saja )?fitur utama deen$/.test(normalizedQuestion) || /fitur utama deen/.test(normalizedQuestion)) return ["kb-about"];
    if (/bagaimana cara mulai belajar|cara mulai belajar|mulai belajar di deen/.test(normalizedQuestion)) return ["kb-course", "kb-progress"];
    if (/bagaimana cara (mengerjakan|ikut|menjawab) (quiz|kuis)|cara mengerjakan (quiz|kuis)|mengerjakan (quiz|kuis)/.test(normalizedQuestion)) return ["kb-quiz"];
    if (/bagaimana cara (join|gabung|bergabung) room|cara (join|gabung|bergabung) room|join room|gabung room/.test(normalizedQuestion)) return ["kb-join-room"];
    if (/apa itu xp di deen|apa itu streak|apa itu xp dan streak/.test(normalizedQuestion)) return normalizedQuestion.includes("streak") && normalizedQuestion.includes("xp") ? ["kb-xp-point", "kb-checkin-streak"] : [normalizedQuestion.includes("streak") ? "kb-checkin-streak" : "kb-xp-point"];
    return [];
  })();
  if (directKnowledgeIds.length) {
    const chunks = directKnowledgeIds
      .map((id) => DEEN_KNOWLEDGE.find((chunk) => chunk.id === id))
      .filter((chunk): chunk is (typeof DEEN_KNOWLEDGE)[number] => Boolean(chunk));
    if (chunks.length) {
      const answer = chunks.map((chunk) => chunk.text).join("\n\n");
      const safe = guardOutput(answer);
      const directSources: AISource[] = chunks.map((chunk) => ({ id: chunk.id, title: chunk.title, type: chunk.type }));
      return finish(safe.text, domain, safe.ok, directSources, false, rulesMeta());
    }
  }

  // ---- data dinamis lewat tool terotorisasi ----
  const toolResults: ToolResult[] = [];
  const toolNotes: string[] = [];
  const sources: AISource[] = [];
  // Orang tua sering menyebut nama anak (bukan kata "anak") → kenali nama anak yang terhubung.
  const childNames = user.role === "PARENT" ? (await parentService.students(user).catch(() => [])).flatMap((c) => c.name.split(" ")) : [];
  for (const name of routeIntent(message, user.role, childNames).tools) {
    const r = await runTool(name, { user, message });
    if (r.ok === false) {
      toolNotes.push((r as { ok: false; note: string }).note);
      continue;
    }
    const okResult = r as { ok: true; data: unknown; source: AISource["type"] };
    toolResults.push({ tool: name, data: okResult.data });
    // Jangan membuka nama tool internal ke client (05B §13) — tampilkan label ramah.
    const src = toolSource(name, okResult.source);
    if (!sources.some((s) => s.id === src.id)) sources.push(src);
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
  const isSuggestedQuestion = SUGGESTION_ONLY.has(message.trim().toLowerCase());
  // Tombol saran tidak pernah memanggil LLM. Jika sumber tidak tersedia, jawab jujur daripada mengarang.
  if (isSuggestedQuestion && !grounded) {
    const note = toolNotes.length ? toolNotes.join(" ") : NO_CONTEXT;
    return finish(note, domain, false, [], false);
  }
  // Materi keagamaan tanpa sumber Deen: jawaban dari tool/RAG umum saja tidak cukup untuk topik ini.
  const noDeenReligiousSource = domain === "RELIGIOUS_KNOWLEDGE" && !hits.some((h) => h.chunk.type !== "knowledge" || !h.chunk.id.startsWith("kb-"));
  // Catatan otorisasi/klarifikasi dari tool dijawab apa adanya — tidak boleh "diperkaya" LLM.
  if (!grounded && toolNotes.length) return finish(toolNotes.join(" "), domain, false, [], false);

  // Mode "general": tidak ada konteks Deen yang cukup (atau topik agama tanpa sumber Deen) → LLM boleh memakai
  // pengetahuan umum, tetap dibatasi domain guard, prompt khusus, anggaran token, dan output guard.
  const general = !grounded || noDeenReligiousSource;
  const fallbackText = domain === "RELIGIOUS_KNOWLEDGE" ? NO_RELIGIOUS_SOURCE : NO_CONTEXT;

  const provider = getProvider();
  const llmOn = provider.name !== "local";
  const info = describeProvider();
  const budget = llmOn ? await readUsage(user.id) : null; // null bila LLM mati / Firestore gagal → tetap melayani
  const exhausted = isExhausted(budget);

  const older = history.length >= e.AI_MAX_RECENT_MESSAGES ? history.slice(0, history.length - 6) : [];
  const newSummary = older.length ? summarizeOlder(older, e.AI_MAX_SUMMARY_TOKENS) : undefined;

  if (general && (!llmOn || exhausted)) {
    if (!llmOn) return finish(fallbackText, domain, false, [], false);
    return finish(`${fallbackText} ${LIMIT_NOTE}`, domain, false, [], false, rulesMeta("limit_reached"), undefined, budget);
  }

  const mode: AIMode = general ? "general" : "deen_data";
  const promptInput = { role: user.role, chunks: hits, tools: toolResults, summary: conv?.summary ?? null, toolNotes };
  const request: AIRequest = {
    system: general ? buildGeneralPrompt(promptInput) : buildSystemPrompt(promptInput),
    messages: [...history, { role: "user", content: message }],
    maxTokens: e.AI_MAX_TOKENS,
    timeoutMs: e.AI_TIMEOUT_MS,
    context: { domain, userMessage: message, chunks: hits, tools: toolResults },
  };

  // Jalur deterministik: jika jawaban sudah memiliki sumber Deen/tools, jangan panggil provider eksternal.
  // Ini memastikan pertanyaan saran dan pertanyaan grounded lain tidak mengonsumsi token LLM.
  if (!general) {
    const local = guardOutput((await localProvider.generate(request)).text || NO_CONTEXT);
    return finish(local.text, domain, local.ok, sources, false, rulesMeta(), newSummary, null);
  }

  /** LLM tidak dipakai/gagal: jalur data Deen dijawab dari aturan + RAG + tool (tanpa LLM); jalur umum memakai pesan standar. */
  const degrade = async (reason: NonNullable<AIMessageMeta["reason"]>): Promise<ChatOutcome> => {
    if (general) return finish(reason === "limit_reached" ? `${fallbackText} ${LIMIT_NOTE}` : fallbackText, domain, false, [], false, rulesMeta(reason), undefined, budget);
    const local = guardOutput((await localProvider.generate(request)).text || NO_CONTEXT);
    return finish(local.text, domain, local.ok, sources, false, rulesMeta(reason), newSummary, budget);
  };

  if (exhausted) return degrade("limit_reached");

  let reply: ProviderReply;
  try {
    reply = await provider.generate(request);
  } catch (err) {
    logger.warn("ai_llm_failed_fallback", { userId: user.id, mode, reason: err instanceof Error ? err.name : "unknown" });
    return degrade("unavailable");
  }

  // Token tercatat walau jawaban kosong (provider tetap menagih).
  const usage: TokenUsage = reply.usage ?? (() => {
    const prompt = estimateTokens(request.system + request.messages.map((m) => m.content).join(""));
    const completion = estimateTokens(reply.text);
    return { prompt, completion, total: prompt + completion, estimated: true };
  })();
  await recordUsage(user.id, usage);
  const snapshot = budget ? makeSnapshot(budget.used + usage.total, budget.limit) : null;

  if (!reply.text.trim()) {
    logger.warn("ai_llm_empty_reply", { userId: user.id, mode });
    return degrade("unavailable");
  }

  const guarded = guardOutput(reply.text);
  if (!guarded.ok) logger.warn("ai_output_guard_blocked", { userId: user.id });
  const ai: AIMessageMeta = { engine: "llm", label: info.label, provider: provider.name, model: info.model, mode, tokens: usage };
  // Jawaban mode umum tidak sepenuhnya bersumber Deen → grounded=false (UI membedakannya dari penolakan lewat ai.mode).
  return finish(guarded.text, domain, general ? false : guarded.ok, sources, false, ai, newSummary, snapshot);
}
