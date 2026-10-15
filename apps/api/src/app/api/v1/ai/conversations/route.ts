import { protectedRoute } from "@/shared/http";
import { conversationsQuery } from "@/ai/chat.schema";
import { conversationService } from "@/ai/conversation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ errorStyle: "ai", query: conversationsQuery }, ({ user, query }) =>
  conversationService.list(user.id, query.page, query.limit)
);
