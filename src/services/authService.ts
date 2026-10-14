import { api } from "./api";
import type { LoginRequest } from "../types/auth";
import type { LoginResponse, SessionUser } from "../types/user";

export const authService = {
  login: (payload: LoginRequest) => api.post<LoginResponse>("/auth/login", payload),
  logout: () => api.post<void>("/auth/logout"),
  me: () => api.get<SessionUser>("/auth/me"),
};
