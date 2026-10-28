import type { Timestamp } from "firebase-admin/firestore";

export type Role = "SANTRI" | "PARENT" | "ADMIN" | "SUPERADMIN";
export const ROLES: readonly Role[] = ["SANTRI", "PARENT", "ADMIN", "SUPERADMIN"];

export interface UserDoc {
  name: string;
  username: string;
  usernameLower: string;
  email: string | null;
  emailLower: string | null;
  passwordHash: string;
  role: Role;
  avatarUrl: string | null;
  linkCode: string | null;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

/** Bentuk yang dibaca frontend (types/user.ts → SessionUser). */
export interface SessionUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: Role;
  avatarUrl?: string;
}

export const toSessionUser = (id: string, u: UserDoc): SessionUser => ({
  id,
  name: u.name,
  username: u.username,
  email: u.email ?? undefined,
  role: u.role,
  avatarUrl: u.avatarUrl ?? undefined,
});

export interface AuthUser {
  id: string;
  role: Role;
}
