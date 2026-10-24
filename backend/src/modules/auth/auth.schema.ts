import { z } from "zod";

/** Selaras dengan RegisterRequest/LoginRequest di 04-API-SPEC.yaml dan authSchemas.ts frontend. */
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
    username: z
      .string()
      .trim()
      .min(3, "Username minimal 3 karakter")
      .max(50, "Username maksimal 50 karakter")
      .regex(/^[a-zA-Z0-9_.]+$/, "Username hanya boleh huruf, angka, titik, dan underscore"),
    email: z
      .union([z.literal(""), z.string().trim().max(255).pipe(z.email("Format email tidak valid"))])
      .optional(),
    password: z.string().min(8, "Password minimal 8 karakter").max(128, "Password maksimal 128 karakter"),
    // Registrasi publik hanya SANTRI / PARENT. ADMIN tidak pernah bisa dipilih (privilege escalation).
    role: z.enum(["SANTRI", "PARENT"], { error: "Pilih salah satu peran dulu, ya" }),
  })
  .strict();
export type RegisterInput = z.output<typeof registerSchema>;

export const loginSchema = z
  .object({
    identifier: z.string().trim().min(1, "Masukkan username atau email kamu").max(255),
    password: z.string().min(1, "Masukkan password kamu").max(128),
  })
  .strict();
export type LoginInput = z.output<typeof loginSchema>;

export const forgotPasswordSchema = z
  .object({ identifier: z.string().trim().min(1, "Masukkan username atau email kamu").max(255) })
  .strict();
export type ForgotPasswordInput = z.output<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(20, "Tautan reset tidak valid").max(200, "Tautan reset tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter").max(128, "Password maksimal 128 karakter"),
  })
  .strict();
export type ResetPasswordInput = z.output<typeof resetPasswordSchema>;

export const refreshSchema = z.object({ refreshToken: z.string().min(10).max(4096) }).strict();

export const logoutSchema = z.object({ refreshToken: z.string().max(4096).optional() }).strict();

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    avatarUrl: z.union([z.url({ protocol: /^https$/ }).max(500), z.null()]).optional(),
    // Upload avatar dikirim bersama perubahan profil melalui PATCH /users/me.
    avatarUpload: z.object({
      fileName: z.string().trim().min(1).max(180),
      contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
      data: z.string().min(1).max(2_800_000),
    }).strict().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "Tidak ada data yang diubah" });
export type UpdateProfileInput = z.output<typeof updateProfileSchema>;
