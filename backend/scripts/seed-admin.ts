import { db, ts } from "../src/lib/firebase";
import { C } from "../src/shared/collections";
import { hashPassword } from "../src/shared/security";
import { uniqueRef } from "../src/shared/unique";

export type AdminSeedConfig = {
  id: string;
  name: string;
  username: string;
  password: string;
  email: string | null;
  role: "ADMIN";
};

export const ADMIN_SEED: AdminSeedConfig = {
  id: "admin",
  name: "Administrator",
  username: "admin",
  password: "1234567890",
  email: "admin@deen.id",
  role: "ADMIN",
};

export function getAdminSeedConfig(): AdminSeedConfig {
  return { ...ADMIN_SEED };
}

export async function seedAdmin() {
  const admin = getAdminSeedConfig();
  const now = ts();
  const passwordHash = await hashPassword(admin.password);

  await db().collection(C.users).doc(admin.id).set({
    name: admin.name,
    username: admin.username,
    usernameLower: admin.username.toLowerCase(),
    email: admin.email,
    emailLower: admin.email?.toLowerCase() ?? null,
    passwordHash,
    role: admin.role,
    avatarUrl: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });

  await uniqueRef("username", admin.username).set({
    userId: admin.id,
    type: "username",
    createdAt: now,
  });

  if (admin.email) {
    await uniqueRef("email", admin.email).set({
      userId: admin.id,
      type: "email",
      createdAt: now,
    });
  }

  return admin;
}
