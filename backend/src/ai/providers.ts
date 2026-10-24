import { env } from "@/config/env";
import { Errors } from "@/shared/errors";
import { logger } from "@/shared/logger";
import type { AIProvider, AIRequest, ProviderReply, TokenUsage } from "./types";

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : 0);
const usageOf = (prompt: unknown, completion: unknown, total?: unknown): TokenUsage | undefined => {
  const p = num(prompt), c = num(completion);
  const t = num(total) || p + c;
  return p || c || t ? { prompt: p, completion: c, total: t } : undefined;
};

/** Perkiraan kasar (≈4 karakter/token) — dipakai hanya bila provider tidak melaporkan usage. */
export const estimateTokens = (text: string) => Math.ceil(text.length / 4);

function makeProvider(name: string, generate: (req: AIRequest) => Promise<ProviderReply>): AIProvider {
  return { name, generate, async generateReply(req) { return (await generate(req)).text; } };
}

async function postJson(url: string, headers: Record<string, string>, body: unknown, timeoutMs: number) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body), signal: ctrl.signal });
    if (!res.ok) {
      // detail provider TIDAK diteruskan ke client (hanya dilog; logger menyamarkan field berisi kunci)
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      logger.error("ai_provider_http_error", { status: res.status, url, detail });
      throw Errors.unavailable("Layanan AI sedang tidak tersedia. Silakan coba kembali.");
    }
    return (await res.json()) as Record<string, unknown>;
  } catch (err) {
    if (err instanceof Error && err.name === "AppError") throw err;
    logger.error("ai_provider_failed", { reason: err instanceof Error ? err.name : "unknown", message: err instanceof Error ? err.message : undefined });
    throw Errors.unavailable("Layanan AI sedang tidak tersedia. Silakan coba kembali.");
  } finally {
    clearTimeout(timer);
  }
}

const anthropic: AIProvider = makeProvider("anthropic", async (req: AIRequest) => {
    const e = env();
    const data = await postJson(
      `${e.AI_BASE_URL ?? "https://api.anthropic.com"}/v1/messages`,
      { "x-api-key": e.AI_API_KEY ?? "", "anthropic-version": "2023-06-01" },
      { model: e.AI_MODEL ?? "claude-haiku-5-5", max_tokens: req.maxTokens, system: req.system, messages: req.messages },
      req.timeoutMs
    );
    const blocks = (data.content as { type: string; text?: string }[] | undefined) ?? [];
    const u = data.usage as { input_tokens?: number; output_tokens?: number } | undefined;
    return { text: blocks.filter((b) => b.type === "text").map((b) => b.text ?? "").join("").trim(), usage: usageOf(u?.input_tokens, u?.output_tokens) };
});

/** Juga cocok untuk endpoint OpenAI-compatible lain (set AI_BASE_URL). */
const openai: AIProvider = makeProvider("openai", async (req: AIRequest) => {
    const e = env();
    const base = (e.AI_BASE_URL ?? "https://api.openai.com/v1").trim().replace(/\/+$/, "");
    const data = await postJson(
      `${base}/chat/completions`,
      { authorization: `Bearer ${(e.AI_API_KEY ?? "").trim()}` },
      {
        model: e.AI_MODEL ?? "gpt-4o-mini",
        max_tokens: req.maxTokens,
        temperature: 0.3,
        ...(e.AI_REASONING_EFFORT ? { reasoning_effort: e.AI_REASONING_EFFORT } : {}),
        messages: [{ role: "system", content: req.system }, ...req.messages],
      },
      req.timeoutMs
    );
    const choices = (data.choices as { message?: { content?: string }; finish_reason?: string }[] | undefined) ?? [];
    const content = (choices[0]?.message?.content ?? "").trim();
    if (!content) logger.warn("ai_provider_empty_reply", { finishReason: choices[0]?.finish_reason ?? "unknown", model: e.AI_MODEL });
    const u = data.usage as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;
    return { text: content, usage: usageOf(u?.prompt_tokens, u?.completion_tokens, u?.total_tokens) };
});

const label = (k: string) => k.replace(/([A-Z])/g, " $1").toLowerCase();
/** Ubah data tool menjadi teks yang enak dibaca (bukan JSON mentah). */
export function humanize(data: unknown): string {
  if (Array.isArray(data)) return data.length ? data.map((d) => `- ${humanize(d)}`).join("\n") : "(kosong)";
  if (data && typeof data === "object") {
    return Object.entries(data as Record<string, unknown>)
      .map(([k, v]) => `${label(k)}: ${v !== null && typeof v === "object" ? `\n${humanize(v)}` : v === null ? "-" : typeof v === "boolean" ? (v ? "ya" : "belum") : String(v)}`)
      .join(", ")
      .replace(/, (?=[a-z ]+: \n)/g, "\n");
  }
  return String(data);
}

/** Tanpa LLM: menyusun jawaban dari hasil RAG + tool. Dipakai untuk demo offline/tes dan sebagai fallback aman. */
export const localProvider: AIProvider = makeProvider("local", async ({ context }: AIRequest) => {
    const parts: string[] = [];
    for (const t of context.tools) parts.push(`Data kamu (${t.tool.replace(/^get_/, "").replace(/_/g, " ")}):\n${humanize(t.data)}`);
    const top = context.chunks.slice(0, 2);
    for (const c of top) parts.push(`${c.chunk.title}: ${c.chunk.text}`);
    return { text: parts.join("\n\n") };
});

export function getProvider(): AIProvider {
  const e = env();
  if (e.AI_PROVIDER !== "local" && !e.AI_API_KEY) logger.warn("ai_key_missing_fallback_local", { provider: e.AI_PROVIDER });
  if (e.AI_PROVIDER === "local" || !e.AI_API_KEY) return localProvider;
  logger.info("ai_provider_selected", { provider: e.AI_PROVIDER, model: e.AI_MODEL, base: e.AI_BASE_URL });
  return e.AI_PROVIDER === "anthropic" ? anthropic : openai;
}

/** Ringkasan provider aktif untuk status UI (tanpa kunci). */
export function describeProvider() {
  const e = env();
  const enabled = e.AI_PROVIDER !== "local" && !!e.AI_API_KEY;
  const model = enabled ? (e.AI_MODEL ?? (e.AI_PROVIDER === "anthropic" ? "claude-haiku-5-5" : "gpt-4o-mini")) : null;
  const label = !enabled ? "Aturan Deen" : /gemini/i.test(model ?? "") ? "Gemini" : e.AI_PROVIDER === "anthropic" ? "Claude" : "AI";
  return { enabled, provider: enabled ? e.AI_PROVIDER : "local", model, label };
}
