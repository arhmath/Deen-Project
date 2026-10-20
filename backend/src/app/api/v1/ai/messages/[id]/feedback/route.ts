import { protectedRoute } from "@/shared/http";
import { feedbackSchema } from "@/ai/chat.schema";
import { conversationService } from "@/ai/conversation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = protectedRoute({ errorStyle: "ai", body: feedbackSchema }, ({ user, params, body }) =>
  conversationService.feedback(user.id, params.id!, body)
);
