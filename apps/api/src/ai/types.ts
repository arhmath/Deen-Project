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

/** Antarmuka provider (09-ROADMAP §12): provider dapat diganti tanpa mengubah domain chatbot. */
export interface AIProvider {
  readonly name: string;
  generateReply(input: AIRequest): Promise<string>;
}

export interface AISource {
  id: string;
  title: string;
  type: "knowledge" | "course" | "profile" | "progress" | "notification" | "documentation";
}
