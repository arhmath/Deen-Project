import { env } from "@/config/env";
import { Errors } from "@/shared/errors";
import { logger } from "@/shared/logger";
import type { AIProvider, AIRequest } from "./types";

async function postJson(url: string, headers: Record<string, string>, body: unknown, timeoutMs: number) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body), signal: ctrl.signal });
    if (!res.ok) {
      // detail provider TIDAK diteruskan ke client (hanya dilog tanpa kunci)
      logger.error("ai_provider_http_error", { status: res.status });
      throw Errors.unavailable("Layanan AI sedang tidak tersedia. Silakan coba kembali.");
    }
    return (await res.json()) as Record<string, unknown>;
  } catch (err) {
    if (err instanceof Error && err.name === "AppError") throw err;
    logger.error("ai_provider_failed", { reason: err instanceof Error ? err.name : "unknown" });
    throw Errors.unavailable("Layanan AI sedang tidak tersedia. Silakan coba kembali.");
  } finally {
    clearTimeout(timer);
  }
}

const anthropic: AIProvider = {
  name: "anthropic",
  async generateReply(req: AIRequest) {
    const e = env();
    const data = await postJson(
      `${e.AI_BASE_URL ?? "https://api.anthropic.com"}/v1/messages`,
      { "x-api-key": e.AI_API_KEY ?? "", "anthropic-version": "2023-06-01" },
      { model: e.AI_MODEL ?? "claude-haiku-5-5", max_tokens: req.maxTokens, system: req.system, messages: req.messages },
      req.timeoutMs
    );
    const blocks = (data.content as { type: string; text?: string }[] | undefined) ?? [];
    return blocks.filter((b) => b.type === "text").map((b) => b.text ?? "").join("").trim();
  },
};

/** Juga cocok untuk endpoint OpenAI-compatible lain (set AI_BASE_URL). */
const openai: AIProvider = {
  name: "openai",
  async generateReply(req: AIRequest) {
    const e = env();
    const data = await postJson(
      `${e.AI_BASE_URL ?? "https://api.openai.com/v1"}/chat/completions`,
      { authorization: `Bearer ${e.AI_API_KEY ?? ""}` },
      { model: e.AI_MODEL ?? "gpt-4o-mini", max_tokens: req.maxTokens, temperature: 0.3, messages: [{ role: "system", content: req.system }, ...req.messages] },
      req.timeoutMs
    );
    const choices = (data.choices as { message?: { content?: string } }[] | undefined) ?? [];
    return (choices[0]?.message?.content ?? "").trim();
  },
};

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
export const localProvider: AIProvider = {
  name: "local",
  async generateReply({ context }: AIRequest) {
    const parts: string[] = [];
    for (const t of context.tools) parts.push(`Data kamu (${t.tool.replace(/^get_/, "").replace(/_/g, " ")}):\n${humanize(t.data)}`);
    const top = context.chunks.slice(0, 2);
    for (const c of top) parts.push(`${c.chunk.title}: ${c.chunk.text}`);
    return parts.join("\n\n");
  },
};

export function getProvider(): AIProvider {
  const e = env();
  if (e.AI_PROVIDER === "local" || !e.AI_API_KEY) return localProvider;
  return e.AI_PROVIDER === "anthropic" ? anthropic : openai;
}
