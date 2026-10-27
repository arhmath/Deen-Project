import { protectedRoute } from "@/shared/http";
import { describeProvider } from "@/ai/providers";
import { readUsage } from "@/ai/usage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Status AI untuk UI: apakah LLM aktif (label/model) dan pemakaian token hari ini terhadap batas. Tanpa kunci/konfigurasi rahasia. */
export const GET = protectedRoute(
  { errorStyle: "ai", rateLimit: [{ name: "ai-usage", limit: 30, windowMs: 60_000, by: "user" }] },
  async ({ user }) => {
    const info = describeProvider();
    return {
      message: "Status AI berhasil diambil",
      data: { enabled: info.enabled, label: info.label, model: info.model, usage: info.enabled ? await readUsage(user.id) : null },
    };
  }
);
