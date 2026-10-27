export type AllowedDomain =
  | "DEEN_FEATURE" | "LEARNING" | "COURSE" | "MODULE" | "CONTENT" | "LESSON" | "QUIZ" | "PROGRESS"
  | "GAMIFICATION" | "LEADERBOARD" | "ROOM" | "PARENT_MONITORING" | "NOTIFICATION" | "MAPS"
  | "RELIGIOUS_KNOWLEDGE" | "PROFILE";

export type BlockedDomain =
  | "GENERAL_PROGRAMMING" | "GENERAL_GAMING" | "GENERAL_POLITICS" | "GENERAL_ENTERTAINMENT"
  | "GENERAL_RESEARCH" | "UNRELATED" | "PROMPT_INJECTION";

export type AIDomain = AllowedDomain | BlockedDomain;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface Chunk {
  id: string;
  title: string;
  text: string;
  /** jenis sumber yang ditampilkan ke client */
  type: "knowledge" | "course" | "documentation";
}

export interface ScoredChunk {
  chunk: Chunk;
  score: number;
}

export interface ToolResult {
  tool: string;
  /** ringkasan data (sudah lolos otorisasi) */
  data: unknown;
}

/** Konteks terstruktur — dipakai provider lokal; provider LLM memakai `system`+`messages`. */
export interface LocalContext {
  domain: AIDomain;
  userMessage: string;
  chunks: ScoredChunk[];
  tools: ToolResult[];
}

export interface AIRequest {
  system: string;
  messages: ChatTurn[];
  maxTokens: number;
  timeoutMs: number;
  context: LocalContext;
}

/** Pemakaian token satu panggilan LLM. `estimated` = dihitung perkiraan karena provider tidak melaporkannya. */
export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
  estimated?: boolean;
}

export interface ProviderReply {
  text: string;
  usage?: TokenUsage;
}

/** Antarmuka provider (09-ROADMAP §12): provider dapat diganti tanpa mengubah domain chatbot. */
export interface AIProvider {
  readonly name: string;
  /** Jawaban + pemakaian token. */
  generate(input: AIRequest): Promise<ProviderReply>;
  /** Hanya teks (kompatibel dengan pemanggil lama, mis. scripts/ai-chat.ts). */
  generateReply(input: AIRequest): Promise<string>;
}

/** deen_data = dijawab dari data/materi Deen; general = pengetahuan umum LLM; rules = tanpa LLM. */
export type AIMode = "deen_data" | "general" | "rules";

/** Metadata mesin penjawab — disimpan di pesan asisten dan dikirim ke client untuk status/badge. */
export interface AIMessageMeta {
  engine: "llm" | "rules";
  /** Nama tampilan: "Gemini", "Claude", "AI", atau "Aturan Deen". */
  label: string;
  provider: string;
  model: string | null;
  mode: AIMode;
  tokens: TokenUsage | null;
  /** Mengapa LLM tidak dipakai padahal aktif. */
  reason?: "limit_reached" | "unavailable";
}

export interface UsageSnapshot {
  used: number;
  /** null = tanpa batas */
  limit: number | null;
  remaining: number | null;
  resets_at: string;
}

export interface AISource {
  id: string;
  title: string;
  type: "knowledge" | "course" | "profile" | "progress" | "notification" | "documentation";
}
