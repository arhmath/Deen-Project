import type { UserRole } from "./auth";

/** Role lengkap. ADMIN (Guru/Ustadz) di-provision platform, tidak lewat register publik. */
export type Role = UserRole | "ADMIN" | "SUPERADMIN";

export const ROLE_LABEL: Record<Role, string> = {
  SANTRI: "Santri",
  PARENT: "Orang Tua/Wali",
  ADMIN: "Guru/Ustadz",
  SUPERADMIN: "Superadmin",
};

/** Response `GET /auth/me`. Backend adalah source of truth untuk role. */
export interface SessionUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: Role;
  avatarUrl?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: SessionUser;
}
