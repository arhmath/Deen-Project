import { z } from "zod";

export const createRoomSchema = z
  .object({
    name: z.string().trim().min(3, "Nama room minimal 3 karakter").max(150),
    description: z.string().trim().max(1000).optional(),
  })
  .strict();
export type CreateRoomInput = z.output<typeof createRoomSchema>;

export const updateRoomSchema = z
  .object({
    name: z.string().trim().min(3).max(150).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "Tidak ada data yang diubah" });
export type UpdateRoomInput = z.output<typeof updateRoomSchema>;

export const joinRoomSchema = z
  .object({
    joinCode: z
      .string()
      .trim()
      .min(4, "Kode room tidak valid")
      .max(12, "Kode room tidak valid")
      .regex(/^[A-Za-z0-9]+$/, "Kode room tidak valid")
      .optional(),
    code: z
      .string()
      .trim()
      .min(4, "Kode room tidak valid")
      .max(12, "Kode room tidak valid")
      .regex(/^[A-Za-z0-9]+$/, "Kode room tidak valid")
      .optional(),
  })
  .strict()
  .refine((v) => Boolean(v.joinCode || v.code), { message: "Kode room tidak valid" })
  .transform((v) => ({ joinCode: (v.joinCode ?? v.code)!.toUpperCase() }));
export type JoinRoomInput = z.output<typeof joinRoomSchema>;
