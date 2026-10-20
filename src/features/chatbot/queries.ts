import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "../../services/chatService";
import type { AIFeedbackRequest } from "../../types/chat";

export const chatKeys = {
  list: ["chat", "conversations"] as const,
  detail: (id: string) => ["chat", "conversation", id] as const,
};

export const useConversations = () =>
  useQuery({ queryKey: chatKeys.list, queryFn: () => chatService.conversations(1, 30) });

/** Riwayat satu percakapan. gcTime 0: saat dibuka lagi selalu memuat ulang dari server (sumber kebenaran). */
export const useConversation = (id: string | null) =>
  useQuery({
    queryKey: chatKeys.detail(id ?? "none"),
    queryFn: () => chatService.conversation(id!),
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: chatService.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.list }),
  });
}

export const useSendFeedback = () =>
  useMutation({ mutationFn: (v: { messageId: string } & AIFeedbackRequest) => chatService.feedback(v.messageId, { rating: v.rating, comment: v.comment }) });
