import { noContent, protectedRoute } from "@/shared/http";
import { conversationService } from "@/ai/conversation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ errorStyle: "ai" }, ({ user, params }) => conversationService.detail(user.id, params.id!));
export const DELETE = protectedRoute({ errorStyle: "ai" }, async ({ user, params }) => {
  await conversationService.remove(user.id, params.id!);
  return noContent();
});
