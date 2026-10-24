/**
 * Kontrak Deen AI — 05B-AI-ARCHITECTURE & 04-API-SPEC.yaml (/ai/*).
 * Identitas & role TIDAK pernah dikirim di body; backend membacanya dari JWT.
 */
export type ChatRole = "user" | "assistant";
export type FeedbackRating = "positive" | "negative";

export interface AISource {
  id: string;
  title: string;
  type: "knowledge" | "course" | "profile" | "progress" | "notification" | "documentation";
}

/** Pemakaian token satu panggilan LLM. `estimated` = perkiraan (provider tidak melaporkan). */
export interface AITokenUsage {
  prompt: number;
  completion: number;
  total: number;
  estimated?: boolean;
}

/** deen_data = dari data/materi Deen; general = pengetahuan umum LLM; rules = tanpa LLM. */
export type AIMode = "deen_data" | "general" | "rules";

/** Mesin yang menjawab sebuah pesan (disimpan server, ikut muncul di riwayat). */
export interface AIMessageMeta {
  engine: "llm" | "rules";
  /** "Gemini", "Claude", "AI", atau "Aturan Deen". */
  label: string;
  provider: string;
  model: string | null;
  mode: AIMode;
  tokens: AITokenUsage | null;
  /** LLM aktif tetapi tidak dipakai: batas harian habis / layanan tidak tersedia. */
  reason?: "limit_reached" | "unavailable";
}

/** Pemakaian token hari ini. `limit` null = tanpa batas. */
export interface AIUsageSnapshot {
  used: number;
  limit: number | null;
  remaining: number | null;
  resets_at: string;
}

export interface AIStatus {
  enabled: boolean;
  label: string;
  model: string | null;
  usage: AIUsageSnapshot | null;
}

export interface AIStatusResponse {
  message: string;
  data: AIStatus;
}

export interface AIResponseMeta {
  intent?: string;
  /** Domain hasil klasifikasi (mis. GAMIFICATION, UNRELATED, PROMPT_INJECTION). */
  domain?: string;
  grounded: boolean;
  ai?: AIMessageMeta;
}

/** Pesan di UI. Field `status` hanya ada di klien (tidak dikirim/diterima dari server). */
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  created_at: string;
  sources?: AISource[];
  meta?: AIResponseMeta;
  status?: "sending" | "failed";
}

export interface AIChatRequest {
  message: string;
  conversation_id?: string | null;
}

export interface AIChatResponse {
  message: string;
  data: {
    conversation_id: string;
    message: { id: string; role: "assistant"; content: string; created_at: string };
    sources?: AISource[];
    meta?: AIResponseMeta;
    /** Pemakaian hari ini; null/tidak ada bila LLM tidak dipakai pada pesan ini. */
    usage?: AIUsageSnapshot | null;
  };
}

export interface AIConversation {
  id: string;
  title: string;
  message_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AIConversationList {
  message: string;
  data: AIConversation[];
  pagination?: { page: number; limit: number; total: number };
}

export interface AIConversationDetail {
  message: string;
  data: { id: string; title: string; created_at: string; messages: ChatMessage[] };
}

export interface AIFeedbackRequest {
  rating: FeedbackRating;
  comment?: string;
}
