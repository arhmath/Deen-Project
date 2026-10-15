import { noContent, protectedRoute } from "@/shared/http";
import { notificationService } from "@/modules/notifications/notification.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = protectedRoute({}, async ({ user, params }) => {
  await notificationService.markRead(user.id, params.notificationId!);
  return noContent();
});
