import { protectedRoute } from "@/shared/http";
import { listNotificationsQuery, notificationService } from "@/modules/notifications/notification.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ query: listNotificationsQuery }, ({ user, query }) => notificationService.list(user.id, query));
