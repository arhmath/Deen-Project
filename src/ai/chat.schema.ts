import { z } from "zod";
import { SAFE_ID } from "@/shared/ids";

/** AIChatRequest (05B §7). Koordinat diterima sesuai kontrak tetapi tidak disimpan/dipakai (Maps belum ada). */
export const chatSchema = z
  .object({
    message: z.string().trim().min(1, "Pesan tidak boleh kosong").max(4000, "Pesan maksimal 4000 karakter"),
    conversation_id: z.string().regex(SAFE_ID).nullish(),
    latitude: z.number().min(-90).max(90).nullish(),
    longitude: z.number().min(-180).max(180).nullish(),
  })
  .strict();
export type ChatInput = z.output<typeof chatSchema>;

export const feedbackSchema = z
  .object({ rating: z.enum(["positive", "negative"]), comment: z.string().trim().max(1000).optional() })
  .strict();

export const conversationsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
