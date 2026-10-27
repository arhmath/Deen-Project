import { created, protectedRoute } from "@/shared/http";
import { parentService, parentStudentLinkSchema } from "@/modules/parent/parent.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = protectedRoute({ roles: ["PARENT"] }, ({ user }) => parentService.students(user));
export const POST = protectedRoute({ roles: ["PARENT"], body: parentStudentLinkSchema }, async ({ user, body }) =>
  created(await parentService.linkStudentByCode(user, body))
);
