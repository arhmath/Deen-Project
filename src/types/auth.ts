/**
 * Auth-related types.
 * Mirrors `RegisterRequest` / `LoginRequest` schemas in 04-API-SPEC.yaml.
 * NOTE: role "ADMIN" (Guru/Ustadz) is provisioned by the platform, not via
 * public self-registration — so it is intentionally excluded here.
 */

export type UserRole = "SANTRI" | "PARENT";

export interface RegisterRequest {
  name: string;
  username: string;
  email?: string;
  password: string;
  role: UserRole;
}

export interface LoginRequest {
  /** username or email, per API spec's `identifier` field */
  identifier: string;
  password: string;
}

export interface AuthFormServerError {
  message: string;
  fieldErrors?: Partial<Record<keyof RegisterRequest | keyof LoginRequest, string>>;
}
