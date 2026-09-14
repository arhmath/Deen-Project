import { z } from "zod";

/**
 * Validation rules are kept in sync with 04-API-SPEC.yaml
 * (RegisterRequest / LoginRequest) so client-side errors never diverge
 * from what the backend will ultimately enforce.
 */

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Masukkan username atau email kamu"),
  password: z.string().min(1, "Masukkan password kamu"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nama minimal 2 karakter")
      .max(100, "Nama maksimal 100 karakter"),
    username: z
      .string()
      .min(3, "Username minimal 3 karakter")
      .max(50, "Username maksimal 50 karakter")
      .regex(
        /^[a-zA-Z0-9_.]+$/,
        "Username hanya boleh huruf, angka, titik, dan underscore"
      ),
    email: z
      .string()
      .email("Format email tidak valid")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .max(128, "Password maksimal 128 karakter"),
    confirmPassword: z.string().min(1, "Ulangi password kamu"),
    role: z.enum(["SANTRI", "PARENT"], {
      errorMap: () => ({ message: "Pilih salah satu peran dulu, ya" }),
    }),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({
        message: "Setujui syarat & ketentuan untuk lanjut",
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak sama",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
