import { api } from "./api";
import type {
  AIChatRequest,
  AIChatResponse,
  AIConversationDetail,
  AIConversationList,
  AIFeedbackRequest,
  AIStatusResponse,
} from "../types/chat";

/** Semua path relatif terhadap VITE_API_URL (…/api/v1) → http://…/api/v1/ai/chat. Jangan hard-code "/api/ai". */
export const chatService = {
  send: (payload: AIChatRequest) => api.post<AIChatResponse>("/ai/chat", payload),
  /** Ziya publik: endpoint RAG-only, tidak membutuhkan autentikasi dan tidak memakai LLM. */
  sendPublic: (payload: Pick<AIChatRequest, "message">) => api.post<AIChatResponse>("/ai/public-chat", payload),
  /** Status AI + pemakaian token hari ini (untuk bar status chatbot). */
  status: () => api.get<AIStatusResponse>("/ai/usage"),
  conversations: (page = 1, limit = 30) =>
    api.get<AIConversationList>("/ai/conversations", { params: { page, limit } }),
  conversation: (id: string) => api.get<AIConversationDetail>(`/ai/conversations/${id}`),
  remove: (id: string) => api.delete<{ message: string } | undefined>(`/ai/conversations/${id}`),
  feedback: (messageId: string, payload: AIFeedbackRequest) =>
    api.post<{ message: string }>(`/ai/messages/${messageId}/feedback`, payload),
};
