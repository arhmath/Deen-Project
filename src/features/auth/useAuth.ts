import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "../../services/authService";
import { tokenStore } from "../../services/tokenStore";
import type { Role, SessionUser } from "../../types/user";

export const ME_KEY = ["auth", "me"] as const;

/** Beranda tiap role. */
export const homePathFor = (role: Role) => (role === "ADMIN" ? "/admin" : "/dashboard");

/** Sesi dibaca dari server (GET /auth/me) — bukan dari localStorage. */
export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: authService.me,
    enabled: !!tokenStore.get(),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (res) => {
      tokenStore.set(res.accessToken);
      qc.clear();
      qc.setQueryData<SessionUser>(ME_KEY, res.user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authService.logout().catch(() => undefined),
    onSettled: () => {
      tokenStore.clear();
      qc.clear();
    },
  });
}
