import { api } from "./api";
import type { LoginRequest, RegisterRequest } from "../types/auth";
import type { LoginResponse, SessionUser } from "../types/user";

export const authService = {
  register: (payload: RegisterRequest) => api.post<{ user: SessionUser }>("/auth/register", payload),
  login: (payload: LoginRequest) => api.post<LoginResponse>("/auth/login", payload),
  logout: () => api.post<void>("/auth/logout"),
  me: () => api.get<SessionUser>("/auth/me"),
  updateMe: (payload: { name: string; avatarUrl?: string | null }) => api.patch<SessionUser>("/users/me", payload),
  uploadAvatar: async (file: File) => {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Foto gagal dibaca."));
      reader.onload = () => {
        const result = String(reader.result ?? "");
        const comma = result.indexOf(",");
        if (comma < 0) reject(new Error("Format foto tidak valid."));
        else resolve(result.slice(comma + 1));
      };
      reader.readAsDataURL(file);
    });
    return api.post<{ avatarUrl: string }>("/users/avatar", { fileName: file.name, contentType: file.type, data });
  },
};
