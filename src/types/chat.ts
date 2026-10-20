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

export interface AIResponseMeta {
  intent?: string;
  /** Domain hasil klasifikasi (mis. GAMIFICATION, UNRELATED, PROMPT_INJECTION). */
  domain?: string;
  grounded: boolean;
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
