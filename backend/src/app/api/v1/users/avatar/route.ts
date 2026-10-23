import { randomUUID } from "node:crypto";
import { z } from "zod";
import { protectedRoute } from "@/shared/http";
import { storageBucket } from "@/lib/firebase";
import { Errors } from "@/shared/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uploadAvatarSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  data: z.string().min(1).max(2_800_000),
}).strict();

export const POST = protectedRoute(
  { body: uploadAvatarSchema, maxBodyBytes: 2_900_000, rateLimit: [{ name: "avatar-upload", limit: 10, windowMs: 60_000, by: "user" }] },
  async ({ user, body }) => {
    const buffer = Buffer.from(body.data, "base64");
    if (!buffer.length || buffer.length > 2 * 1024 * 1024) throw Errors.tooLarge();

    // Periksa magic bytes supaya ekstensi/MIME yang dikirim client tidak menjadi satu-satunya validasi.
    const validSignature = body.contentType === "image/jpeg"
      ? buffer[0] === 0xff && buffer[1] === 0xd8
      : body.contentType === "image/png"
        ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
    if (!validSignature) throw Errors.badRequest("Isi file tidak cocok dengan format gambar.");

    let bucket;
    try {
      bucket = storageBucket();
    } catch {
      throw Errors.unavailable("Penyimpanan foto belum dikonfigurasi. Hubungi administrator.");
    }
    const extension = body.contentType === "image/jpeg" ? "jpg" : body.contentType === "image/png" ? "png" : "webp";
    const token = randomUUID();
    const objectPath = `avatars/${user.id}/${randomUUID()}.${extension}`;
    const file = bucket.file(objectPath);
    await file.save(buffer, {
      resumable: false,
      metadata: {
        contentType: body.contentType,
        cacheControl: "public, max-age=86400",
        metadata: { firebaseStorageDownloadTokens: token, ownerUid: user.id },
      },
      validation: "crc32c",
    });

    const avatarUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
    return { avatarUrl };
  },
);
