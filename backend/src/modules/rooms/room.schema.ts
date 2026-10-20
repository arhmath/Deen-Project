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
      .regex(/^[A-Za-z0-9]+$/, "Kode room tidak valid"),
  })
  .strict();
export type JoinRoomInput = z.output<typeof joinRoomSchema>;
