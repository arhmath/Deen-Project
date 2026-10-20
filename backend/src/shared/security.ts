import bcrypt from "bcryptjs";
import { env } from "@/config/env";

export const hashPassword = (plain: string) => bcrypt.hash(plain, env().BCRYPT_COST);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

/** Hash "bayangan" untuk menyamakan waktu respons saat user tidak ditemukan (anti user-enumeration). */
let dummy: string | undefined;
export async function verifyAgainstDummy(plain: string): Promise<void> {
  dummy ??= await bcrypt.hash("deen-dummy-password", env().BCRYPT_COST);
  await bcrypt.compare(plain, dummy);
}
