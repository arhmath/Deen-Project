import { created, protectedRoute } from "@/shared/http";
import { linkRequestSchema, parentService } from "@/modules/parent/parent.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = protectedRoute(
  { roles: ["PARENT"], body: linkRequestSchema, rateLimit: [{ name: "parent-link", limit: 5, windowMs: 60_000, by: "user" }] },
  async ({ user, body }) => created(await parentService.requestLink(user, body))
);
