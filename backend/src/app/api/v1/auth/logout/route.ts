import { noContent, publicRoute } from "@/shared/http";
import { logoutSchema } from "@/modules/auth/auth.schema";
import { authService } from "@/modules/auth/auth.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Selalu sukses (204) — frontend memanggil tanpa body; refreshToken opsional untuk mencabut sesi.
export const POST = publicRoute({ body: logoutSchema }, async ({ body }) => {
  await authService.logout(body.refreshToken);
  return noContent();
});
