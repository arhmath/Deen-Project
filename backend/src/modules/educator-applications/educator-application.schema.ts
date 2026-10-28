import { z } from "zod";

export const educatorApplicationSchema = z.object({
  fullName: z.string().trim().min(3, "Nama lengkap minimal 3 karakter").max(100),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Masukkan alamat Gmail yang valid"))
    .refine((v) => v.endsWith("@gmail.com"), "Gunakan alamat Gmail aktif untuk pemulihan akun."),
  phone: z.string().trim().min(8, "Nomor WhatsApp terlalu pendek").max(20).regex(/^[+0-9 ()-]+$/, "Nomor telepon tidak valid"),
  institution: z.string().trim().min(2, "Nama lembaga wajib diisi").max(150),
  city: z.string().trim().min(2, "Kota/kabupaten wajib diisi").max(100),
  education: z.enum(["SMA/SMK", "D3", "S1", "S2", "S3", "Pesantren/Nonformal", "Lainnya"]),
  subjects: z.array(z.enum(["Al-Qur'an dan Tahsin", "Akidah dan Akhlak", "Fikih dan Ibadah", "Sejarah Islam", "Bahasa Arab", "Lainnya"]))
    .min(1, "Pilih minimal satu bidang ajar").max(6),
  experience: z.enum(["Belum berpengalaman", "Kurang dari 1 tahun", "1–3 tahun", "Lebih dari 3 tahun"]),
  motivation: z.string().trim().min(30, "Ceritakan motivasi minimal 30 karakter").max(1000),
  evidenceUrl: z.union([z.literal(""), z.url("Masukkan URL bukti yang valid").max(500)]).optional(),
  verificationConsent: z.literal(true, { error: "Persetujuan verifikasi wajib dicentang." }),
}).strict();

export const educatorDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(500).optional(),
}).strict();
export type EducatorApplicationInput = z.output<typeof educatorApplicationSchema>;
