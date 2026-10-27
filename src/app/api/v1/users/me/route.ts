import { protectedRoute } from "@/shared/http";
import { updateProfileSchema } from "@/modules/auth/auth.schema";
import { userService } from "@/modules/users/user.service";
import { v2 as cloudinary } from "cloudinary";
import { Errors } from "@/shared/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = protectedRoute({}, ({ user }) => userService.getMe(user.id));

export const PATCH = protectedRoute(
  {
    body: updateProfileSchema,
    maxBodyBytes: 2_900_000,
    rateLimit: [{ name: "profile-update", limit: 20, windowMs: 60_000, by: "user" }],
  },
  async ({ user, body }) => {
    let avatarUrl = body.avatarUrl;

    if (body.avatarUpload) {
      const { contentType, data } = body.avatarUpload;
      const buffer = Buffer.from(data, "base64");
      if (!buffer.length || buffer.length > 2 * 1024 * 1024) throw Errors.tooLarge();

      // Validasi signature file, jangan hanya mempercayai MIME dari browser.
      const validSignature = contentType === "image/jpeg"
        ? buffer[0] === 0xff && buffer[1] === 0xd8
        : contentType === "image/png"
          ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
      if (!validSignature) throw Errors.badRequest("Isi file tidak cocok dengan format gambar.");

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      if (!cloudName || !apiKey || !apiSecret) {
        throw Errors.unavailable("Cloudinary belum dikonfigurasi. Isi CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET.");
      }

      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
      try {
        const uploaded = await cloudinary.uploader.upload(
          `data:${contentType};base64,${data}`,
          {
            folder: `deen/avatars/${user.id}`,
            resource_type: "image",
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
            transformation: [{ width: 512, height: 512, crop: "limit" }],
          },
        );
        avatarUrl = uploaded.secure_url;
      } catch {
        throw Errors.unavailable("Gagal mengunggah foto ke Cloudinary. Periksa konfigurasi dan kuota akun Cloudinary.");
      }
    }

    const { avatarUpload: _avatarUpload, ...profile } = body;
    return userService.updateMe(user.id, {
      ...profile,
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    });
  },
);
